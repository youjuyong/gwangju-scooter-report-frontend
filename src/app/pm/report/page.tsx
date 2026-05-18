"use client";

import React, {useState} from "react";
import ReportPmQRCode from "@/components/pm/report/ReportPmQRCode";

export default function ReportPage() {
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

    return (
        <ReportPmQRCode
            formData={formData}
            onUpdate={(data) => updateFormData(data)}
        />
    );
}