"use client";

import { ShoppingCart, Check, Loader2, Clock, Wifi, RadioTower, Infinity as InfinityIcon } from "lucide-react";
import { useCurrency } from "@/lib/currency-context";

export interface PlanBundle {
  bundle_code: string;
  bundle_name: string;
  marketing_name: string;
  data_label: string;
  unlimited: boolean;
  validity_days: number;
  price: number;
  currency: string;
}

interface PlanCardProps {
  bundle: PlanBundle;
  added: boolean;
  adding: boolean;
  onAdd: (bundle: PlanBundle) => void;
}

export default function PlanCard({ bundle, added, adding, onAdd }: PlanCardProps) {
  const { format } = useCurrency();
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden hover:border-orange-100 hover:shadow-md transition-all duration-200">
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[26px] font-bold text-[#1A1D20] leading-none">{bundle.data_label}</h3>
            <p className="text-[14px] text-[#6B7280] font-medium mt-1.5">{bundle.validity_days} days</p>
          </div>
          <div className="flex items-center justify-center shrink-0">
            <svg viewBox="0 0 512 512" className="w-8 h-8 fill-[#FF561E]" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M385.302,0h-56.459c-1.84,9.035-9.819,15.834-19.396,15.834c-9.583,0-17.562-6.799-19.402-15.834h-68.09 c-1.833,9.035-9.82,15.834-19.396,15.834c-9.576,0-17.563-6.799-19.396-15.834h-56.458c-24.792,0-44.889,20.098-44.889,44.889 v358.785c0,11.91,4.729,23.326,13.146,31.743l63.437,63.438c8.417,8.417,19.84,13.146,31.743,13.146h195.16 c24.792,0,44.882-20.098,44.882-44.889V44.889C430.184,20.098,410.094,0,385.302,0z M263.261,65.979h45.361v68.951h-45.361V65.979z M203.386,65.979h45.361v68.951h-45.361V65.979z M139.879,96.84c0-17.042,13.82-30.861,30.862-30.861h18.125v68.951h-48.986V96.84z M139.879,229.278h48.986v68.951H170.74c-17.042,0-30.862-13.82-30.862-30.861V229.278z M178.289,410.034 c-13.431,0-26.48-5.326-33.195-11.784c-0.507-0.507-0.756-1.396-0.125-2.152l9.625-11.021c0.507-0.632,1.272-0.632,1.903-0.125 c5.702,4.555,13.431,8.868,22.556,8.868c8.993,0,14.062-4.18,14.062-10.264c0-5.07-3.042-8.236-13.306-9.632l-4.562-0.632 c-17.479-2.409-27.236-10.639-27.236-25.84c0-15.84,11.91-26.354,30.527-26.354c11.402,0,22.049,3.417,29.271,8.993 c0.757,0.507,0.889,1.014,0.25,1.896l-7.722,11.535c-0.514,0.632-1.139,0.757-1.778,0.382c-6.584-4.312-12.924-6.59-20.021-6.59 c-7.597,0-11.521,3.923-11.521,9.374c0,4.944,3.542,8.112,13.424,9.5l4.562,0.632c17.737,2.41,27.111,10.521,27.111,26.098 C212.115,398.507,200.587,410.034,178.289,410.034z M203.386,298.229v-68.951h45.361v68.951H203.386z M250.879,407.375 c0,0.758-0.514,1.264-1.271,1.264h-16.09c-0.764,0-1.264-0.506-1.264-1.264v-83.618c0-0.764,0.501-1.271,1.264-1.271h16.09 c0.757,0,1.271,0.507,1.271,1.271V407.375z M355.135,407.375c0,0.758-0.507,1.264-1.264,1.264h-14.312 c-0.764,0-1.271-0.506-1.271-1.264v-48.528h-0.507l-15.965,36.361c-0.507,1.139-1.264,1.646-2.403,1.646h-8.743 c-1.14,0-1.903-0.507-2.41-1.646l-15.965-36.361h-0.5v48.528c0,0.758-0.514,1.264-1.271,1.264h-14.312 c-0.764,0-1.271-0.506-1.271-1.264v-83.618c0-0.764,0.507-1.271,1.271-1.271h15.069c1.014,0,1.652,0.382,2.035,1.271l21.784,49.153 h0.507l21.41-49.153c0.382-0.889,1.02-1.271,2.027-1.271h14.827c0.757,0,1.264,0.507,1.264,1.271V407.375z M263.261,298.229 v-68.951h45.361v68.951H263.261z M372.129,260.125v7.243c0,17.042-13.82,30.861-30.862,30.861h-18.132v-83.465H139.879v-65.32 h232.25V260.125z M372.129,134.93h-48.994V65.979h18.132c17.042,0,30.862,13.82,30.862,30.861V134.93z" />
            </svg>
          </div>
        </div>

        <div className="border-t border-gray-100 my-4" />

        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFF4F0] flex items-center justify-center">
                {bundle.unlimited ? (
                  <InfinityIcon className="w-4 h-4 text-[#FF561E]" strokeWidth={2} />
                ) : (
                  <Wifi className="w-4 h-4 text-[#FF561E]" strokeWidth={2} />
                )}
              </div>
              <p className="text-[14px] text-[#6B7280]">Data</p>
            </div>
            <p className="text-[14px] font-bold text-[#1A1D20]">{bundle.data_label}</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFF4F0] flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#FF561E]" strokeWidth={2} />
              </div>
              <p className="text-[14px] text-[#6B7280]">Validity</p>
            </div>
            <p className="text-[14px] font-bold text-[#1A1D20]">{bundle.validity_days} days</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFF4F0] flex items-center justify-center">
                <RadioTower className="w-4 h-4 text-[#FF561E]" strokeWidth={2} />
              </div>
              <p className="text-[14px] text-[#6B7280]">Network</p>
            </div>
            <p className="text-[14px] font-bold text-[#1A1D20]">4G / LTE</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-[#FFF4F0] px-5 py-4">
        <div>
          <p className="text-[13px] text-[#6B7280]">Price</p>
          <p className="text-[24px] font-bold text-[#FF561E] leading-tight">{format(bundle.price)}</p>
        </div>
        <button
          onClick={() => onAdd(bundle)}
          disabled={added || adding}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[14px] font-bold transition-all duration-200 ${
            added
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : "bg-[#FF561E] text-white hover:bg-[#E04B18] shadow-sm shadow-orange-500/20"
          }`}
        >
          {adding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : added ? (
            <>
              <Check className="w-4 h-4" /> Added
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
