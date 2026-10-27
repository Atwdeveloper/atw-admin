"use client";

import React from "react";
import { useNavigate } from "@/lib/navigation"; // If using React Router, otherwise replace with a button using window.location
import { AlertCircle, ArrowLeft } from "lucide-react";

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <>
      {/* <Header /> */}
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-orange-100 rounded-full mb-6">
            <AlertCircle className="w-12 h-12 text-orange-500" />
          </div>

          {/* Error Code */}
          <h1 className="text-6xl md:text-8xl font-bold text-gray-900 mb-4">
            404
          </h1>

          {/* Message */}
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            Sorry, the page you are looking for doesn’t exist or has been moved.
          </p>

          {/* Home Button */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
      {/* <Footer /> */}
    </>
  );
};

export default NotFoundPage;
