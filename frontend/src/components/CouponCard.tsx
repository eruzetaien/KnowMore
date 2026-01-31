import React from "react";
import type { ReactNode } from "react";

interface CouponCardProps {
  children: ReactNode; 
  isRed?: boolean;   
}

const CouponCard: React.FC<CouponCardProps> = ({ children, isRed = false }) => {
  const bgClass = isRed ? "bg-[#E1CECE]" : "bg-[#E1D9CE]";
  const borderClass = isRed ? "border-coupon-red" : "border-coupon-fill";

  return (
    <div className="w-full">
      <div className={`border-2 ${borderClass}`}>
        <div className="border-4 border-coupon-white">
          <div className={`border-4 ${borderClass}`}>
            <div className={`p-2 text-xl ${bgClass}`}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponCard;
