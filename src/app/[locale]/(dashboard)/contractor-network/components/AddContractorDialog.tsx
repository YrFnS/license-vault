"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { TRADE_TYPES, US_STATES } from "./types";

interface AddContractorForm {
	companyName: string;
	tradeType: string;
	licenseNumber: string;
	licenseState: string;
	licenseStatus: string;
	licenseExpiry: string;
	contactName: string;
	contactEmail: string;
	contactPhone: string;
	address: string;
	city: string;
	state: string;
	zip: string;
	website: string;
	insuranceProvider: string;
	insuranceExpiry: string;
	insuranceStatus: string;
	bondingCapacity: string;
	totalProjects: string;
	completedProjects: string;
	rating: string;
	yearsInBusiness: string;
	employeeCount: string;
	notes: string;
}

interface AddContractorDialogProps {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	form: AddContractorForm;
	onFormChange: (updater: (prev: AddContractorForm) => AddContractorForm) => void;
	onSave: () => void;
	saving: boolean;
}

export function AddContractorDialog({
	open, onOpenChange, form, onFormChange, onSave, saving,
}: AddContractorDialogProps) {
	const t = useTranslations("contractorNetwork");
	const tc = useTranslations("common");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t("addContractor")}</DialogTitle>
					<DialogDescription>Add a new contractor to your directory</DialogDescription>
				</DialogHeader>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
					{/* Row 1 */}
					<div className="space-y-2">
						<Label>Company Name *</Label>
						<Input value={form.companyName} onChange={(e) => onFormChange((f) => ({ ...f, companyName: e.target.value }))} placeholder="Acme Electrical" />
					</div>
					<div className="space-y-2">
						<Label>Trade Type *</Label>
						<Select value={form.tradeType} onValueChange={(v) => onFormChange((f) => ({ ...f, tradeType: v }))}>
							<SelectTrigger><SelectValue /></SelectTrigger>
							<SelectContent>
								{TRADE_TYPES.map((tt) => (
									<SelectItem key={tt} value={tt}>{t(tt as any) || tt}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{/* Row 2 */}
					<div className="space-y-2">
						<Label>License Number</Label>
						<Input value={form.licenseNumber} onChange={(e) => onFormChange((f) => ({ ...f, licenseNumber: e.target.value }))} />
					</div>
					<div className="space-y-2">
						<Label>License State</Label>
						<Select value={form.licenseState} onValueChange={(v) => onFormChange((f) => ({ ...f, licenseState: v }))}>
							<SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
							<SelectContent>
								{US_STATES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
							</SelectContent>
						</Select>
					</div>
					{/* Row 3 */}
					<div className="space-y-2">
						<Label>License Status</Label>
						<Select value={form.licenseStatus} onValueChange={(v) => onFormChange((f) => ({ ...f, licenseStatus: v }))}>
							<SelectTrigger><SelectValue /></SelectTrigger>
							<SelectContent>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="expired">Expired</SelectItem>
								<SelectItem value="suspended">Suspended</SelectItem>
								<SelectItem value="revoked">Revoked</SelectItem>
								<SelectItem value="unknown">Unknown</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>License Expiry</Label>
						<Input type="date" value={form.licenseExpiry} onChange={(e) => onFormChange((f) => ({ ...f, licenseExpiry: e.target.value }))} />
					</div>
					{/* Row 4 */}
					<div className="space-y-2">
						<Label>Contact Name</Label>
						<Input value={form.contactName} onChange={(e) => onFormChange((f) => ({ ...f, contactName: e.target.value }))} />
					</div>
					<div className="space-y-2">
						<Label>Contact Email</Label>
						<Input type="email" value={form.contactEmail} onChange={(e) => onFormChange((f) => ({ ...f, contactEmail: e.target.value }))} />
					</div>
					{/* Row 5 */}
					<div className="space-y-2">
						<Label>Contact Phone</Label>
						<Input value={form.contactPhone} onChange={(e) => onFormChange((f) => ({ ...f, contactPhone: e.target.value }))} />
					</div>
					<div className="space-y-2">
						<Label>Address</Label>
						<Input value={form.address} onChange={(e) => onFormChange((f) => ({ ...f, address: e.target.value }))} />
					</div>
					{/* Row 6 */}
					<div className="space-y-2">
						<Label>City</Label>
						<Input value={form.city} onChange={(e) => onFormChange((f) => ({ ...f, city: e.target.value }))} />
					</div>
					<div className="space-y-2">
						<Label>State</Label>
						<Select value={form.state} onValueChange={(v) => onFormChange((f) => ({ ...f, state: v }))}>
							<SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
							<SelectContent>
								{US_STATES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
							</SelectContent>
						</Select>
					</div>
					{/* Row 7 */}
					<div className="space-y-2">
						<Label>ZIP</Label>
						<Input value={form.zip} onChange={(e) => onFormChange((f) => ({ ...f, zip: e.target.value }))} />
					</div>
					<div className="space-y-2">
						<Label>Website</Label>
						<Input value={form.website} onChange={(e) => onFormChange((f) => ({ ...f, website: e.target.value }))} />
					</div>
					{/* Row 8 */}
					<div className="space-y-2">
						<Label>Insurance Provider</Label>
						<Input value={form.insuranceProvider} onChange={(e) => onFormChange((f) => ({ ...f, insuranceProvider: e.target.value }))} />
					</div>
					<div className="space-y-2">
						<Label>Insurance Expiry</Label>
						<Input type="date" value={form.insuranceExpiry} onChange={(e) => onFormChange((f) => ({ ...f, insuranceExpiry: e.target.value }))} />
					</div>
					{/* Row 9 */}
					<div className="space-y-2">
						<Label>Insurance Status</Label>
						<Select value={form.insuranceStatus} onValueChange={(v) => onFormChange((f) => ({ ...f, insuranceStatus: v }))}>
							<SelectTrigger><SelectValue /></SelectTrigger>
							<SelectContent>
								<SelectItem value="compliant">Compliant</SelectItem>
								<SelectItem value="deficient">Deficient</SelectItem>
								<SelectItem value="expired">Expired</SelectItem>
								<SelectItem value="unknown">Unknown</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Bonding Capacity ($)</Label>
						<Input type="number" value={form.bondingCapacity} onChange={(e) => onFormChange((f) => ({ ...f, bondingCapacity: e.target.value }))} />
					</div>
					{/* Row 10 */}
					<div className="space-y-2">
						<Label>Total Projects</Label>
						<Input type="number" value={form.totalProjects} onChange={(e) => onFormChange((f) => ({ ...f, totalProjects: e.target.value }))} />
					</div>
					<div className="space-y-2">
						<Label>Completed Projects</Label>
						<Input type="number" value={form.completedProjects} onChange={(e) => onFormChange((f) => ({ ...f, completedProjects: e.target.value }))} />
					</div>
					{/* Row 11 */}
					<div className="space-y-2">
						<Label>Rating (0-5)</Label>
						<Input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => onFormChange((f) => ({ ...f, rating: e.target.value }))} />
					</div>
					<div className="space-y-2">
						<Label>Years in Business</Label>
						<Input type="number" value={form.yearsInBusiness} onChange={(e) => onFormChange((f) => ({ ...f, yearsInBusiness: e.target.value }))} />
					</div>
					{/* Row 12 */}
					<div className="space-y-2">
						<Label>Employee Count</Label>
						<Select value={form.employeeCount} onValueChange={(v) => onFormChange((f) => ({ ...f, employeeCount: v }))}>
							<SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
							<SelectContent>
								<SelectItem value="1-10">1-10</SelectItem>
								<SelectItem value="11-50">11-50</SelectItem>
								<SelectItem value="51-200">51-200</SelectItem>
								<SelectItem value="200+">200+</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{/* Row 13 - Notes */}
					<div className="space-y-2 md:col-span-2">
						<Label>Notes</Label>
						<Textarea value={form.notes} onChange={(e) => onFormChange((f) => ({ ...f, notes: e.target.value }))} rows={3} />
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
					<Button onClick={onSave} disabled={saving}
						className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
						{saving ? <Loader2 className="size-4 animate-spin me-1" /> : <Plus className="size-4 me-1" />}
						{tc("create")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
