import React from "react";
import type { ReactNode } from "react";

interface CouponCardProps {
  children: ReactNode; 
  color?: string;   
}

const CouponCard: React.FC<CouponCardProps> = ({ children, color = false }) => {
  let bgClass: string;
  let borderClass: string;
  let innerBorderClass: string;

  switch (color) {
    case "red":
      bgClass = "bg-[#E1CECE]";
      borderClass = "border-coupon-red";
      innerBorderClass = "border-coupon-white";
      break;
    case "orange":
      bgClass = "bg-[#E7DFAB]";
      borderClass = "border-coupon-light-orange";
      innerBorderClass = "border-coupon-orange";
      break;
    default:
      bgClass = "bg-[#E1D9CE]";
      borderClass = "border-coupon-fill";
      innerBorderClass = "border-coupon-white";
  }
  
  return (
    <div className="w-full">
      <div className={`border-2 ${borderClass}`}>
        <div className={`border-4 ${innerBorderClass}`}>
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
