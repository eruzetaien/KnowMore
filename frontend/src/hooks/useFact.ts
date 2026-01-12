import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateFactGroupRequest, CreateFactRequest, FactGroupResponse, FactResponse, UpdateFactGroupRequest, UpdateFactRequest} from "../types/factType";
import { createFact, createFactGroup, fetchAllFactGroup, updateFact, updateFactGroup } from "../api/factApi";
import toast from "react-hot-toast";

export const useAllUserFactQuery = () => {
  return useQuery<FactGroupResponse[]>({
    queryKey: ["userFact"],
    queryFn: fetchAllFactGroup,
  });
};

export const useCreateFactGroup = () => {
  const queryClient = useQueryClient();

  return useMutation<FactGroupResponse, Error, CreateFactGroupRequest>({
    mutationFn: createFactGroup,

    onMutate: () => {
      toast.loading("Creating fact group...", { id: "create-fact-group" });
    },

    onSuccess: (newGroup) => {
      queryClient.setQueryData<FactGroupResponse[]>(
        ["userFact"],
        (old = []) => [newGroup, ...old]
      );

      toast.success("Fact group created successfully!", {
        id: "create-fact-group",
      });
    },

    onError: (error) => {
      toast.error(error.message || "Failed to create fact group", {
        id: "create-fact-group",
      });
    },
  });
};

export const useCreateFact = () => {
  const queryClient = useQueryClient();
  return useMutation<FactResponse, Error, CreateFactRequest>({
    mutationFn: createFact,

    onMutate: () => {
      toast.loading("Creating fact...", { id: "create-fact" });
    },

    onSuccess: (newFact) => {
      queryClient.setQueryData<FactGroupResponse[]>(
        ["userFact"],
        (old = []) =>
          old.map(group =>
            group.id === newFact.factGroupId
              ? { ...group, facts: [newFact, ...group.facts] }
              : group
          )
      );

      toast.success("Fact created successfully!", {
        id: "create-fact",
      });
    },

    onError: (error) => {
      toast.error(error.message || "Failed to create fact", {
        id: "create-fact",
      });
    },
  });
};

export const useUpdateFactGroup = () => {
  const queryClient = useQueryClient();
  return useMutation<FactGroupResponse, Error, UpdateFactGroupRequest>({
    mutationFn: updateFactGroup,

    onMutate: () => {
      toast.loading("Updating fact group...", { id: "update-fact-group" });
    },

    onSuccess: (updatedGroup) => {
      queryClient.setQueryData<FactGroupResponse[]>(
        ["userFact"],
        (old = []) =>
          [updatedGroup, ...old.filter(g => g.id !== updatedGroup.id)]
      );

      toast.success("Fact group updated successfully!", {
        id: "update-fact-group",
      });
    },

    onError: (error) => {
      toast.error(error.message || "Failed to update fact group", {
        id: "update-fact-group",
      });
    },
  });
};

export const useUpdateFact = () => {
  const queryClient = useQueryClient();
  return useMutation<FactResponse, Error, UpdateFactRequest>({
    mutationFn: updateFact,

    onMutate: () => {
      toast.loading("Updating fact...", { id: "update-fact" });
    },

    onSuccess: (updatedFact) => {
      queryClient.setQueryData<FactGroupResponse[]>(
        ["userFact"],
        (old = []) =>
          old.map(group =>
            group.id === updatedFact.factGroupId
              ? {
                  ...group,
                  facts: group.facts.map(f =>
                    f.id === updatedFact.id ? updatedFact : f
                  ),
                }
              : group
          )
      );

      toast.success("Fact updated successfully!", {
        id: "update-fact",
      });
    },

    onError: (error) => {
      toast.error(error.message || "Failed to update fact", {
        id: "update-fact",
      });
    },
  });
};
