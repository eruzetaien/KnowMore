import type { Emoticon } from "../context/GameHubContext";

export interface EmoticonResponse {
  sender: string;
  emoticon: Emoticon;
}