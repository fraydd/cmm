import React, { createContext, useContext, useState } from 'react';

const BranchContext = createContext();

export function BranchProvider({ children }) {
  const [selectedBranch, setSelectedBranch] = useState(null);
  return (
    <BranchContext.Provider value={{ selectedBranch, setSelectedBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  return {
    ...context,
    branchId: context.selectedBranch?.id
  };
} 