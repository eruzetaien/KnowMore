import { useState } from "react";
import type { FactGroupResponse } from "../types/factType";

import paperContent from "../assets/paper-content.svg";
import paperTableOfContent from "../assets/paper-table-of-content.svg";
import arrowBackIcon from "../assets/icons/back-arrow.svg";
import penIcon from "../assets/icons/pen.svg";
import xIcon from "../assets/icons/x.svg";
// import { useAllUserFactQuery } from "../hooks/useFact";

const factGroupDummyData: FactGroupResponse[] | undefined = [
  {
    id: 1,
    userId: 101,
    name: "Science Facts",
    facts: [
      {
        id: 1,
        userId: 101,
        factGroupId: 1,
        description: "Water boils at 100°C.",
        createdAt: "2023-01-15T10:30:00Z",
        updatedAt: "2023-01-15T10:30:00Z",
      },
      {
        id: 2,
        userId: 101,
        factGroupId: 1,
        description: "The Earth orbits the Sun once every 365.25 days.",
        createdAt: "2023-01-16T11:00:00Z",
        updatedAt: "2023-01-16T11:00:00Z",
      },
      {
        id: 3,
        userId: 101,
        factGroupId: 1,
        description: "A human's DNA is 99.9% identical to every other human.",
        createdAt: "2023-01-17T12:00:00Z",
        updatedAt: "2023-01-17T12:00:00Z",
      },
    ],
    createdAt: "2023-01-15T10:30:00Z",
    updatedAt: "2023-01-17T12:00:00Z",
  },
  {
    id: 2,
    userId: 102,
    name: "Animal Facts",
    facts: [
      {
        id: 4,
        userId: 102,
        factGroupId: 2,
        description: "An octopus has three hearts.",
        createdAt: "2023-05-03T09:45:00Z",
        updatedAt: "2023-05-03T09:45:00Z",
      },
      {
        id: 5,
        userId: 102,
        factGroupId: 2,
        description: "Elephants are the only animals that can't jump.",
        createdAt: "2023-05-04T10:00:00Z",
        updatedAt: "2023-05-04T10:00:00Z",
      },
      {
        id: 6,
        userId: 102,
        factGroupId: 2,
        description: "A group of flamingos is called a 'flamboyance'.",
        createdAt: "2023-05-05T11:00:00Z",
        updatedAt: "2023-05-05T11:00:00Z",
      },
    ],
    createdAt: "2023-05-03T09:45:00Z",
    updatedAt: "2023-05-05T11:00:00Z",
  },
  {
    id: 3,
    userId: 103,
    name: "Tech Facts",
    facts: [
      {
        id: 7,
        userId: 103,
        factGroupId: 3,
        description: "The first computer virus was created in 1983.",
        createdAt: "2023-07-07T11:00:00Z",
        updatedAt: "2023-07-07T11:00:00Z",
      },
      {
        id: 8,
        userId: 103,
        factGroupId: 3,
        description: "The term 'bug' in programming was coined after a moth was found in a computer.",
        createdAt: "2023-07-08T12:00:00Z",
        updatedAt: "2023-07-08T12:00:00Z",
      },
      {
        id: 9,
        userId: 103,
        factGroupId: 3,
        description: "The first video uploaded to YouTube was titled 'Me at the zoo'.",
        createdAt: "2023-07-09T13:00:00Z",
        updatedAt: "2023-07-09T13:00:00Z",
      },
    ],
    createdAt: "2023-07-07T11:00:00Z",
    updatedAt: "2023-07-09T13:00:00Z",
  },
];


type PaperId = "table-of-content" | "content";

function FactPage() {
  // const { data: factGroupData, isLoading, isError, error } = useAllUserFactQuery();
  const factGroupData = factGroupDummyData;
  
  const [activeGroup, setActiveGroup] = useState<FactGroupResponse | null>(null);

  const [newFact, setNewFact] = useState('');

  const [order, setOrder] = useState<[PaperId, PaperId]>([
    "table-of-content",
    "content",
  ]);
  const [animating, setAnimating] = useState(false);

  const [isWriting, setIsWriting] = useState(false);

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

  // if (isLoading) return <p>Loading...</p>;
  // if (isError) return <p>Failed to load user facts: {(error as Error).message}</p>;

  return (
    <div className="relative w-screen h-screen flex justify-center overflow-clip"
      style={{
        cursor: isWriting ? `url(${"src/assets/icons/pen.svg"}) 0 57, auto` : "auto",
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
              <h1 className="text-4xl mb-10 text-center">
                Table of Contents
              </h1>

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
                onClick={() => { bringToTop("table-of-content"); setIsWriting(false);}}
              >
                <img className="h-[36px]" src={arrowBackIcon} alt="" />
              </button>

              <button 
                className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity" 
                onClick={() => setIsWriting((prev => !prev))}
              >
                <img className="h-[36px]" src={isWriting? xIcon : penIcon} alt="" />
              </button>
            </div>
            
            
            <h1 className="w-full text-4xl text-center mb-10 mt-5">
              {activeGroup ? activeGroup.name : "Content"}
            </h1>

            {isWriting && (
              <div className="px-8 mb-4">
                <input
                  type="text"
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  placeholder="Write a new fact"
                  className="w-full text-xl focus:outline-none"
                />
              </div>
            )}

            {activeGroup ? (
              <ul className={`space-y-4 text-xl ${isWriting ? "px-8" : "px-10"}`}>
                
                {activeGroup.facts.map((fact) => (
                  <li key={fact.id} className="pb-2">
                    {isWriting ? (
                      <input
                        type="text"
                        value={fact.description}
                        className="w-full text-xl focus:outline-none"
                      />
                    ) : (
                      fact.description
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
