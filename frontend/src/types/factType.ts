export interface FactResponse {
  id: string;
  userId: string;
  factGroupId?: string | null;
  description: string;
  createdAt: string; 
  updatedAt: string;
}

export interface FactGroupResponse {
  id: string;
  userId: string;
  name: string;
  facts: FactResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface FactForGame {
  id: string;
  description: string;
}

export interface FactGroupForGame {
  id: string;
  name: string;
  facts: FactForGame[];
}

export interface CreateFactGroupRequest {
  name: string;
}

export interface CreateFactRequest {
  factGroupId: string;
  description: string;
}

export interface UpdateFactGroupRequest {
  factGroupId: string;
  name: string;
}

export interface UpdateFactRequest {
  factId: string;
  description: string;
}

export interface DeleteFactRequest {
  factId: string;
}