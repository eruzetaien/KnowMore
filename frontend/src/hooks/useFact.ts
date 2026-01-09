import { useMutation, useQuery } from "@tanstack/react-query";
import type { CreateFactGroupRequest, CreateFactRequest, FactGroupResponse, FactResponse} from "../types/factType";
import { createFact, createFactGroup, fetchAllFactGroup } from "../api/factApi";
import toast from "react-hot-toast";

export const useAllUserFactQuery = () => {
  return useQuery<FactGroupResponse[]>({
    queryKey: ["userFact"],
    queryFn: fetchAllFactGroup,
  });
};

export const useCreateFactGroup = () => {
  return useMutation<FactGroupResponse, Error, CreateFactGroupRequest>({
    mutationFn: createFactGroup,

    onMutate: () => {
      toast.loading("Creating fact group...", { id: "create-fact-group" });
    },

    onSuccess: () => {
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
  return useMutation<FactResponse, Error, CreateFactRequest>({
    mutationFn: createFact,

    onMutate: () => {
      toast.loading("Creating fact...", { id: "create-fact" });
    },

    onSuccess: () => {
      toast.success("Fact created successfully!", {
        id: "create-fact",
      });
    },

    onError: (error) => {
      toast.error(error.message || "Failed to created fact", {
        id: "create-fact",
      });
    },
  });
};
