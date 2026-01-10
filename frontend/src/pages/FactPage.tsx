import { useEffect, useState } from "react";
import type { FactGroupResponse } from "../types/factType";

import paperContent from "../assets/paper-content.svg";
import paperTableOfContent from "../assets/paper-table-of-content.svg";
import arrowBackIcon from "../assets/icons/back-arrow.svg";
import penIcon from "../assets/icons/pen.svg";
import xIcon from "../assets/icons/x.svg";
import { useCreateFact, useCreateFactGroup, useUpdateFact } from "../hooks/useFact";
import { useAllUserFactQuery } from "../hooks/useFact";

type PaperId = "table-of-content" | "content";

function FactPage() {
  const { data: queryFactGroups, isLoading, isError, error } = useAllUserFactQuery();
  
  const [factGroupData, setFactGroupData] = useState<FactGroupResponse[]>([]);
  const [activeGroup, setActiveGroup] = useState<FactGroupResponse | null>(null);

  const [newFact, setNewFact] = useState('');
  const [newFactGroup, setNewFactGroup] = useState('');

  const [order, setOrder] = useState<[PaperId, PaperId]>([
    "table-of-content",
    "content",
  ]);
  const [animating, setAnimating] = useState(false);

  const [isWritingFact, setIsWritingFact] = useState(false);
  const [isWritingFactGroup, setIsWritingFactGroup] = useState(false);
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [editingFactValue, setEditingFactValue] = useState("");

  const {
    mutate: createFactGroup,
    isPending: isCreatingFactGroup,
    data: createdFactGroup,
  } = useCreateFactGroup();

  const {
    mutate: createFact,
    isPending: isCreatingFact,
    data: createdFact,
  } = useCreateFact();

  const {
    mutate: updateFact,
    isPending: isUpdatingFact,
    data: updatedFact,
  } = useUpdateFact();

  useEffect(() => {
    if (queryFactGroups) {
      setFactGroupData(queryFactGroups);
    }
  }, [queryFactGroups]);

  useEffect(() => {
    if (createdFactGroup) {
      setFactGroupData(prev => [createdFactGroup, ...prev]);
    }
  }, [createdFactGroup]);

  useEffect(() => {
    if (createdFact && createdFact.factGroupId && factGroupData) {
      setFactGroupData(prevGroups =>
        prevGroups.map(group =>
          group.id === createdFact.factGroupId
            ? {
                ...group,
                facts: [createdFact, ...group.facts, ],
              }
            : group
        )
      );
    }
  }, [createdFact]);

  useEffect(() => {
    if (updatedFact && updatedFact.factGroupId && factGroupData) {
      setFactGroupData(prevGroups =>
        prevGroups.map(group =>
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
    }
  }, [updatedFact]);

  useEffect(() => {
    if (activeGroup && factGroupData) {
      const updatedGroup = factGroupData.find(g => g.id === activeGroup.id) || null;
      setActiveGroup(updatedGroup);
    }
  }, [factGroupData]);

  const handleCreateFactGroup = () => {
    if (!newFactGroup.trim()) 
      return;
    createFactGroup({ name : newFactGroup });
  };

  const handleCreateFact = () => {
    if (!newFact.trim() || !activeGroup) 
      return;

    console.log(activeGroup);
    createFact({ factGroupId : activeGroup.id, description: newFact });
  };

  const handleUpdateFact = (factId: string) => {
  if (!editingFactValue.trim()) return;

  updateFact(
      { factId: factId, description: editingFactValue }
    );

    setEditingFactId(null);
  };

  const bringToTop = (paper: PaperId) => {
    if (animating || order[0] === paper) return;

    setAnimating(true);

    setTimeout(() => {
      setOrder((prev) =>
        prev[0] === paper ? prev : [paper, prev[0]]
      );
      setAnimating(false);
    }, 300);
  };

  const isTop = (card: PaperId) => order[0] === card;

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Failed to load user facts: {(error as Error).message}</p>;

  return (
    <div className="relative w-screen h-screen flex justify-center overflow-clip"
      style={{
        cursor: isWritingFact ? `url(${"src/assets/icons/pen.svg"}) 0 57, auto` : "auto",
      }}
    >

      {/* Table of Content*/}
      <div
        className={`
        Paper Card 2
          absolute h-full flex justify-center items-center overflow-auto 
          transition-all duration-300 ease-out
          ${
            isTop("table-of-content")
              ? "z-20 -translate-x-8 rotate-1 -bottom-18 " //
              : animating
              ? "-translate-x-16 -rotate-3 -bottom-12"
              : "z-10 -translate-x-12 -rotate-2 -bottom-20"
          }
        `}
      >
        <div className="relative h-full flex justify-center items-center ">
          <img className="h-full" src={paperTableOfContent} alt=""/>

          <div className="absolute w-full h-full flex justify-center p-20">
            <div className="w-full max-w-3xl">
              <h1 className="text-4xl text-center">
                Table of Contents
              </h1>

              <div className="w-full flex justify-center">
                {isWritingFactGroup ? (
                  <div className="text-center mb-1">
                    <input
                      type="text"
                      value={newFactGroup}
                      onChange={(e) => setNewFactGroup(e.target.value)}
                      onBlur={() => setIsWritingFactGroup(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCreateFactGroup();
                          setNewFactGroup("");
                          setIsWritingFactGroup(false);
                        }
                      }}
                      className="w-full text-xl focus:outline-none text-center"
                      disabled={isCreatingFactGroup}
                      autoFocus
                    />
                  </div>
                ) : (
                  <button
                    className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity mb-2"
                    onClick={() => setIsWritingFactGroup(true)}
                  >
                    <img
                      className="h-[24px] transform rotate-[-45deg]"
                      src={xIcon}
                      alt="Add fact group"
                    />
                  </button>
                )}
              </div>

              {factGroupData && factGroupData.length > 0 ? (
                <ul className="space-y-4 text-xl">
                  {factGroupData.map((group, index) => (
                    <li
                      key={group.id}
                      className="flex gap-1 cursor-pointer hover:font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveGroup(group);
                        bringToTop("content");
                      }}
                    >
                      <span>
                        {index + 1}. {group.name}
                      </span>

                      <span className="flex-1 overflow-hidden whitespace-nowrap text-2xl leading-none">
                        ................................................................................................
                      </span>

                      <span className="text-gray-500">›</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-xl text-gray-500">
                  No content available.
                </p>
              )}

            </div>

          </div>

        </div>
      </div>

      {/* Content */}
      <div
        className={`
        Paper Card 2
          absolute h-full -bottom-4 flex justify-center items-center overflow-auto  
          transition-all duration-300 ease-out
          ${
            isTop("content")
              ? "z-20 -rotate-1"
              : animating
              ? "translate-x-16 rotate-3"
              : "z-10 translate-x-6 rotate-2"
          }
        `}
      >
        <div className="relative h-full flex justify-center items-center ">
          <img className="h-full" src={paperContent} alt=""/>

          <div className="absolute w-full h-full flex flex-col pl-20 pr-28 py-16 overflow-auto">

            <div className="flex justify-between">
              <button 
                className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity" 
                onClick={() => { bringToTop("table-of-content"); setIsWritingFact(false);}}
              >
                <img className="h-[36px]" src={arrowBackIcon} alt="" />
              </button>

              <button 
                className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity" 
                onClick={() => setIsWritingFact((prev => !prev))}
              >
                <img className="h-[36px]" src={isWritingFact? xIcon : penIcon} alt="" />
              </button>
            </div>
            
            
            <h1 className="w-full text-4xl text-center mb-10 mt-5">
              {activeGroup ? activeGroup.name : "Content"}
            </h1>

            {isWritingFact && (
              <div className="px-8 mb-4">
                <input
                  type="text"
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { 
                      handleCreateFact();
                      setIsWritingFact(false);
                      setNewFact("");
                    }
                  }}
                  placeholder="Write a new fact"
                  className="w-full text-xl focus:outline-none"
                  disabled={isCreatingFact}
                  autoFocus
                />
              </div>
            )}

            {activeGroup ? (
              <ul className={`space-y-4 text-xl ${isWritingFact ? "px-8" : "px-10"}`}>
                
                {activeGroup.facts.map((fact) => (
                  <li key={fact.id} className="pb-2">
                    {isWritingFact && editingFactId === fact.id ? (
                      <input
                        type="text"
                        value={editingFactValue}
                        onChange={(e) => setEditingFactValue(e.target.value)}
                        onBlur={() => setEditingFactId(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdateFact(fact.id);
                            setEditingFactId(null);
                          }
                          if (e.key === "Escape") setEditingFactId(null);
                        }}
                        className="w-full text-xl focus:outline-none" 
                        disabled={isUpdatingFact}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="hover:font-bold"
                        onClick={() => {
                          setEditingFactId(fact.id);
                          setEditingFactValue(fact.description);
                        }}
                      >
                        {fact.description}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">
                Select a group from the Table of Contents
              </p>
            )}
          </div>

        </div>
        
      </div>
      
    </div>
  );


}

export default FactPage;
