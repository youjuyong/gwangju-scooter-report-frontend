"use client";

import React, {useState} from "react";
import ReportLocation from "@/components/citizen/report/ReportLocation";
import ReportCitizenQRCode from "@/components/citizen/report/ReportCitizenQRCode";
import ReportCitizen from "@/components/citizen/report/ReportCitizen";
import ReportSuccess from "@/components/citizen/report/ReportSuccess";

export default function ReportPage() {
    const [step, setStep] = useState<"QR" | "FORM" | "MAP" | "SUCCESS">("QR");
    const [formData, setFormData] = useState({
        deviceId: "",
        brand: "",
        brandId: "",
        location: "",
        qrValue: "",
        lat: 0,
        lng: 0,
        type: "",
        detail: "",
        agreeChk: false,
        zoneId: "",
    });

    const updateFormData = (newData: Partial<typeof formData>) => {
        setFormData((prev) => ({...prev, ...newData}));
    };

    switch (step) {
        case "QR":
            return (
                <ReportCitizenQRCode
                    formData={formData}
                    onUpdate={(data) => updateFormData(data)}
                    onComplete={() => setStep("FORM")}
                />
            );
        case "MAP":
            return (
                <ReportLocation
                    onSelect={(data) => {
                        updateFormData({
                            location: data.address,
                            lat: data.lat,
                            lng: data.lng
                        });
                        setStep("FORM");
                    }}
                    onBack={() => setStep("FORM")}
                />
            );
        case "FORM":
            return (
                <ReportCitizen
                    formData={formData}
                    onNext={(data) => {
                        updateFormData(data);
                        setStep("MAP");
                    }}
                    onBack={() => setStep("QR")}
                    onSuccess={() => setStep("SUCCESS")}
                />
            );
        case "SUCCESS":
            return <ReportSuccess />;
        default:
            return null;
    }
}