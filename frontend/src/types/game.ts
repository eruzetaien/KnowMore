export const Emoticon = {
  None: 0,
  Shocked: 1,
} as const;
export type Emoticon = (typeof Emoticon)[keyof typeof Emoticon];  

export interface SendEmoticonResponse {
  sender: string;
  emoticon: Emoticon;
}