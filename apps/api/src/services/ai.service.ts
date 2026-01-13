import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class AiService {
    private AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:4001';
    private GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    async analyzeImage(imageUrl: string) {
        // 상대 경로(/uploads/...)를 절대 경로로 변환
        const absoluteImageUrl = imageUrl.startsWith('http')
            ? imageUrl
            : `http://localhost:4000${imageUrl}`;

        try {
            // 1. AI 서버 시도
            const response = await fetch(`${this.AI_SERVER_URL}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_url: absoluteImageUrl })
            });

            if (response.ok) {
                const data: any = await response.json();
                if (data.success && data.candidates) {
                    data.candidates = await Promise.all(
                        data.candidates.map(async (candidate: any) => {
                            const priceInfo = await this.enrichWithPriceInfo(candidate.name);
                            return { ...candidate, ...priceInfo };
                        })
                    );
                    return data;
                }
            }
        } catch (error) {
            console.warn('AI Server failed, falling back to direct Gemini API');
        }

        // 2. AI 서버 실패 시 direct Gemini API (Fallback)
        return await this.analyzeWithGeminiDirect(absoluteImageUrl);
    }

    async analyzeImageBase64(imageBase64: string) {
        try {
            const response = await fetch(`${this.AI_SERVER_URL}/analyze-base64`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_base64: imageBase64 })
            });

            if (response.ok) {
                const data: any = await response.json();
                if (data.success && data.candidates) {
                    data.candidates = await Promise.all(
                        data.candidates.map(async (candidate: any) => {
                            const priceInfo = await this.enrichWithPriceInfo(candidate.name);
                            return { ...candidate, ...priceInfo };
                        })
                    );
                    return data;
                }
            }
        } catch (error) {
            console.warn('AI Server failed, falling back to direct Gemini API');
        }

        // Fallback
        return await this.analyzeWithGeminiDirectBase64(imageBase64);
    }

    private async analyzeWithGeminiDirect(imageUrl: string) {
        if (!this.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        try {
            const genAI = new GoogleGenerativeAI(this.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }); // 최신 모델 사용

            const imageResponse = await fetch(imageUrl);
            const imageBuffer = await imageResponse.arrayBuffer();
            const base64Data = Buffer.from(imageBuffer).toString('base64');

            const result = await model.generateContent([
                this.getPrompt(),
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64Data,
                    },
                },
            ]);

            const text = result.response.text();
            const candidates = this.parseGeminiJson(text);

            const enriched = await Promise.all(
                candidates.map(async (c: any) => ({
                    ...c,
                    ...(await this.enrichWithPriceInfo(c.name)),
                    provider: 'gemini-direct'
                }))
            );

            return {
                success: true,
                candidates: enriched
            };
        } catch (error: any) {
            console.error('Gemini Direct Error:', error);
            throw new Error(`AI Analysis failed: ${error.message}`);
        }
    }

    private async analyzeWithGeminiDirectBase64(imageBase64: string) {
        if (!this.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        try {
            const genAI = new GoogleGenerativeAI(this.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

            const result = await model.generateContent([
                this.getPrompt(),
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64Data,
                    },
                },
            ]);

            const text = result.response.text();
            const candidates = this.parseGeminiJson(text);

            const enriched = await Promise.all(
                candidates.map(async (c: any) => ({
                    ...c,
                    ...(await this.enrichWithPriceInfo(c.name)),
                    provider: 'gemini-direct'
                }))
            );

            return {
                success: true,
                candidates: enriched
            };
        } catch (error: any) {
            throw new Error(`AI Analysis failed: ${error.message}`);
        }
    }

    private getPrompt() {
        return `
당신은 공구 및 장비 식별 전문가입니다. 
이미지를 분석하여 다음 정보를 JSON 배열로 반환해주세요.

요구사항:
1. 가능성이 높은 상위 3개 후보를 제시
2. 각 후보는 신뢰도 순으로 정렬
3. 브랜드, 모델명을 최대한 정확하게 식별

JSON 형식:
[
  {
    "name": "전체 제품명",
    "brand": "브랜드명",
    "model": "모델명",
    "category": "카테고리 (예: 전동공구, 수공구, 측정기기 등)",
    "type": "세부 타입 (예: 드릴, 렌치, 톱 등)",
    "confidence": 0.95,
    "description": "간단한 설명"
  }
]

중요: JSON만 반환하고 다른 텍스트는 포함하지 마세요.
        `.trim();
    }

    private parseGeminiJson(text: string) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('Failed to parse AI response');
        }
        return JSON.parse(jsonMatch[0]);
    }

    async enrichWithPriceInfo(toolName: string) {
        try {
            const price = Math.floor(Math.random() * 200000) + 50000;
            return {
                price,
                store: '다나와',
                url: `https://www.danawa.com/search/?query=${encodeURIComponent(toolName)}`
            };
        } catch (error) {
            console.error('Price enrichment error:', error);
            return {};
        }
    }
}
