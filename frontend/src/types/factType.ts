export interface FactResponse {
  id: number;
  userId: number;
  factGroupId?: number | null; // nullable because [JsonIgnore] hides it
  description: string;
  createdAt: string; 
  updatedAt: string;
}

export interface FactGroupResponse {
  id: number;
  userId: number;
  name: string;
  facts: FactResponse[];
  createdAt: string;
  updatedAt: string;
}
