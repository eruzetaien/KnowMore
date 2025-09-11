export interface FactResponse {
  id: number;
  userId: number;
  factGroupId?: number | null;
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

export interface FactForGame {
  id: number;
  description: string;
}

export interface FactGroupForGame {
  id: number;
  name: string;
  facts: FactForGame[];
}
