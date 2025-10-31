import React from "react";
import { Clock, Loader, CheckCircle, XCircle } from "lucide-react";
import { WITHDRAWAL_STATUS } from "../../utils/withdrawalHelpers";

const WithdrawalStatusBadge = ({ status }) => {
  const config = WITHDRAWAL_STATUS[status] || WITHDRAWAL_STATUS.pending;
  const IconComponent = { Clock, Loader, CheckCircle, XCircle }[config.icon];

  const colorClasses = {
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    green: "bg-green-100 text-green-800 border-green-300",
    red: "bg-red-100 text-red-800 border-red-300",
    gray: "bg-gray-100 text-gray-800 border-gray-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
        colorClasses[config.color]
      }`}
    >
      <IconComponent size={14} />
      {config.label}
    </span>
  );
};

export default WithdrawalStatusBadge;
