import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateFactGroupRequest, CreateFactRequest, FactGroupResponse, FactResponse, UpdateFactGroupRequest, UpdateFactRequest} from "../types/factType";
import { createFact, createFactGroup, fetchAllFactGroup, updateFact, updateFactGroup } from "../api/factApi";
import toast from "react-hot-toast";
import { RequestStatus, type ApiResponse } from "../types/apiType";

export const useAllUserFactQuery = () => {
  return useQuery<ApiResponse<FactGroupResponse[]>>({
    queryKey: ["userFact"],
    queryFn: fetchAllFactGroup,  
  });
};

export const useCreateFactGroup = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<FactGroupResponse>, Error, CreateFactGroupRequest>({
    mutationFn: createFactGroup,

    onMutate: () => {
      toast.loading("Creating fact group...", { id: "create-fact-group" });
    },

    onSuccess: (apiResponse) => {
      if (apiResponse.status === RequestStatus.Success)
      {
        const newGroup = apiResponse.data;
        if (newGroup) {
          queryClient.setQueryData<ApiResponse<FactGroupResponse[]>>(
            ["userFact"],
            (old) => {
              if (!old) return old; 
              return {
                ...old, 
                data: [newGroup, ...(old.data ?? [])], 
              };
            }
          );

        }

        toast.success(apiResponse.message, { id: "create-fact-group",});
        return;
      } 

      const errorMessage = apiResponse.status === RequestStatus.BusinessValidationError ? 
          apiResponse.message : 
          "Failed to create fact group";

      toast.error(errorMessage, { id: "create-fact-group",});
    },

    onError: () => {
      toast.error("Failed to create fact group", {id: "create-fact-group",});
    },

  });
};

export const useCreateFact = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<FactResponse>, Error, CreateFactRequest>({
    mutationFn: createFact,

    onMutate: () => {
      toast.loading("Creating fact...", { id: "create-fact" });
    },

    onSuccess: (apiResponse) => {
      if (apiResponse.status === RequestStatus.Success)
      {
        const newFact = apiResponse.data;
        if (newFact){
          queryClient.setQueryData<ApiResponse<FactGroupResponse[]>>(
            ["userFact"],
            (old) => {
              if (!old) return old; 
              return {
                ...old, 
                data: (old.data ?? []).map(group =>
                  group.id === newFact.factGroupId
                    ? { ...group, facts: [newFact, ...group.facts] }
                    : group
                )
              };
            }
          );
        }

        toast.success(apiResponse.message, { id: "create-fact",});
        return;
      }
      
      const errorMessage = apiResponse.status === RequestStatus.BusinessValidationError ? 
          apiResponse.message : 
          "Failed to create fact";

      toast.error(errorMessage, { id: "create-fact",});
    },

    onError: () => {
      toast.error("Failed to create fact", {id: "create-fact",});
    },
  });
};

export const useUpdateFactGroup = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<FactGroupResponse>, Error, UpdateFactGroupRequest>({
    mutationFn: updateFactGroup,

    onMutate: () => {
      toast.loading("Updating fact group...", { id: "update-fact-group" });
    },

    onSuccess: (apiResponse) => {
      if(apiResponse.status === RequestStatus.Success){
        const updatedGroup = apiResponse.data;
        if (updatedGroup){
          queryClient.setQueryData<ApiResponse<FactGroupResponse[]>>(
            ["userFact"],
            (old) => {
              if (!old) return old;
              return {
                ...old, 
                data: [
                  updatedGroup,
                  ...(old.data ?? []).filter(g => g.id !== updatedGroup.id)
                ],
              };
            }
          );
        }

        toast.success(apiResponse.message, { id: "update-fact-group",});
        return;
      }
      
      const errorMessage = apiResponse.status === RequestStatus.BusinessValidationError ? 
          apiResponse.message : 
          "Failed to update fact group";

      toast.error(errorMessage, { id: "update-fact-group",});
    },

    onError: () => {
      toast.error("Failed to update fact group", {
        id: "update-fact-group",
      });
    },
  });
};

export const useUpdateFact = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<FactResponse>, Error, UpdateFactRequest>({
    mutationFn: updateFact,

    onMutate: () => {
      toast.loading("Updating fact...", { id: "update-fact" });
    },

    onSuccess: (apiResponse) => {
      if (apiResponse.status == RequestStatus.Success){
        const updatedFact = apiResponse.data;
        if (updatedFact){
          queryClient.setQueryData<ApiResponse<FactGroupResponse[]>>(
            ["userFact"],
            (old) => {
              if (!old) return old; 
              return {
                ...old, 
                data: (old.data ?? []).map(group =>
                  group.id === updatedFact.factGroupId
                    ? {
                        ...group,
                        facts: (group.facts ?? []).map(f =>
                          f.id === updatedFact.id ? updatedFact : f
                        ),
                      }
                    : group
                ),
              };
            }
          );

        }

        toast.success(apiResponse.message, {id: "update-fact",});
        return;
      }

      const errorMessage = apiResponse.status === RequestStatus.BusinessValidationError ? 
          apiResponse.message : 
          "Failed to update fact";

      toast.error(errorMessage, { id: "update-fact-group",});
    },

    onError: () => {
      toast.error("Failed to update fact", { id: "update-fact",});
    },
  });
};
