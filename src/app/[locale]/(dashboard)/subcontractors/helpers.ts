export function toForm(sub: {
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  licenseNumber: string | null;
  licenseState: string | null;
  licenseExpiry: string | null;
  insuranceExpiry: string | null;
  insuranceStatus: string;
  notes: string | null;
}) {
  return {
    companyName: sub.companyName || "",
    contactName: sub.contactName || "",
    email: sub.email || "",
    phone: sub.phone || "",
    licenseNumber: sub.licenseNumber || "",
    licenseState: sub.licenseState || "",
    licenseExpiry: sub.licenseExpiry ? sub.licenseExpiry.split("T")[0] : "",
    insuranceExpiry: sub.insuranceExpiry ? sub.insuranceExpiry.split("T")[0] : "",
    insuranceStatus: sub.insuranceStatus || "unknown",
    notes: sub.notes || "",
  };
}

export function toPayload(form: {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: string;
  insuranceExpiry: string;
  insuranceStatus: string;
  notes: string;
}) {
  return {
    companyName: form.companyName,
    contactName: form.contactName || undefined,
    email: form.email || undefined,
    phone: form.phone || undefined,
    licenseNumber: form.licenseNumber || undefined,
    licenseState: form.licenseState || undefined,
    licenseExpiry: form.licenseExpiry || undefined,
    insuranceExpiry: form.insuranceExpiry || undefined,
    insuranceStatus: form.insuranceStatus || undefined,
    notes: form.notes || undefined,
  };
}
