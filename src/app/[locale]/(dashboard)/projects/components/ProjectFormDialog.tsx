"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface FormData {
	name: string;
	description: string;
	clientName: string;
	clientEmail: string;
	location: string;
	state: string;
	startDate: string;
	endDate: string;
	status: string;
	requiredLicenses: string;
	requiredInsurance: string;
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editing: boolean;
	formData: FormData;
	onFormDataChange: (data: FormData) => void;
	onSave: () => void;
	saving: boolean;
	t: (key: string) => string;
	tc: (key: string) => string;
}

export function ProjectFormDialog({
	open,
	onOpenChange,
	editing,
	formData,
	onFormDataChange,
	onSave,
	saving,
	t,
	tc,
}: Props) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{editing ? t("editProject") : t("newProject")}
					</DialogTitle>
					<DialogDescription className="sr-only">
						{editing ? t("editProject") : t("newProject")}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<div className="space-y-2">
						<Label>{t("name")} *</Label>
						<Input
							value={formData.name}
							onChange={(e) =>
								onFormDataChange({ ...formData, name: e.target.value })
							}
							placeholder="e.g., Downtown Office Complex"
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("description_field")}</Label>
						<Textarea
							value={formData.description}
							onChange={(e) =>
								onFormDataChange({ ...formData, description: e.target.value })
							}
							placeholder="Project description..."
							rows={2}
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label>{t("clientName")}</Label>
							<Input
								value={formData.clientName}
								onChange={(e) =>
									onFormDataChange({ ...formData, clientName: e.target.value })
								}
								placeholder="Client name"
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("clientEmail")}</Label>
							<Input
								value={formData.clientEmail}
								onChange={(e) =>
									onFormDataChange({ ...formData, clientEmail: e.target.value })
								}
								placeholder="client@example.com"
							/>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label>{t("location")}</Label>
							<Input
								value={formData.location}
								onChange={(e) =>
									onFormDataChange({ ...formData, location: e.target.value })
								}
								placeholder="e.g., 123 Main St"
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("state")}</Label>
							<Input
								value={formData.state}
								onChange={(e) =>
									onFormDataChange({ ...formData, state: e.target.value })
								}
								placeholder="e.g., CA"
							/>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label>{t("startDate")}</Label>
							<Input
								type="date"
								value={formData.startDate}
								onChange={(e) =>
									onFormDataChange({ ...formData, startDate: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("endDate")}</Label>
							<Input
								type="date"
								value={formData.endDate}
								onChange={(e) =>
									onFormDataChange({ ...formData, endDate: e.target.value })
								}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label>{t("status")}</Label>
						<Select
							value={formData.status}
							onValueChange={(v) =>
								onFormDataChange({ ...formData, status: v })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="active">{t("active")}</SelectItem>
								<SelectItem value="completed">{t("completed")}</SelectItem>
								<SelectItem value="on_hold">{t("onHold")}</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>{t("requiredLicenses")}</Label>
						<Textarea
							value={formData.requiredLicenses}
							onChange={(e) =>
								onFormDataChange({
									...formData,
									requiredLicenses: e.target.value,
								})
							}
							placeholder="List required licenses (one per line)..."
							rows={2}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("requiredInsurance")}</Label>
						<Textarea
							value={formData.requiredInsurance}
							onChange={(e) =>
								onFormDataChange({
									...formData,
									requiredInsurance: e.target.value,
								})
							}
							placeholder="List required insurance (one per line)..."
							rows={2}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{tc("cancel")}
					</Button>
					<Button
						onClick={onSave}
						disabled={saving || !formData.name.trim()}
						className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
					>
						{saving ? tc("loading") : editing ? tc("save") : tc("create")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
