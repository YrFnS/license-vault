"use client";

import { useTranslations } from "next-intl";
import { WorkflowBuilder } from "@/components/workflows/WorkflowBuilder";
import type { WorkflowStep } from "@/components/workflows/WorkflowBuilder.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface BuilderDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingId: string | null;
	name: string;
	onNameChange: (v: string) => void;
	desc: string;
	onDescChange: (v: string) => void;
	category: string;
	onCategoryChange: (v: string) => void;
	trigger: string;
	onTriggerChange: (v: string) => void;
	steps: WorkflowStep[];
	onStepsChange: (s: WorkflowStep[]) => void;
	selectedStepId: string | null;
	onSelectStep: (id: string | null) => void;
	onSave: () => void;
}

export function BuilderDialog({
	open,
	onOpenChange,
	editingId,
	name,
	onNameChange,
	desc,
	onDescChange,
	category,
	onCategoryChange,
	trigger,
	onTriggerChange,
	steps,
	onStepsChange,
	selectedStepId,
	onSelectStep,
	onSave,
}: BuilderDialogProps) {
	const t = useTranslations("workflows");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
				<DialogHeader>
					<DialogTitle>
						{editingId ? t("editWorkflow") : t("createWorkflow")}
					</DialogTitle>
					<DialogDescription>
						{editingId
							? "Modify your workflow steps and settings"
							: "Design a multi-step workflow for compliance processes"}
					</DialogDescription>
				</DialogHeader>

				<ScrollArea className="max-h-[70vh]">
					<div className="space-y-4 pe-4">
						{/* Settings */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-xs font-medium">
									{t("workflowName")}
								</Label>
								<Input
									value={name}
									onChange={(e) => onNameChange(e.target.value)}
									placeholder="e.g., License Renewal Process"
									className="h-9 text-sm"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs font-medium">
									{t("workflowDescription")}
								</Label>
								<Input
									value={desc}
									onChange={(e) => onDescChange(e.target.value)}
									placeholder="Describe the workflow purpose..."
									className="h-9 text-sm"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs font-medium">{t("category")}</Label>
								<Select value={category} onValueChange={onCategoryChange}>
									<SelectTrigger className="h-9 text-sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="license_renewal">
											{t("licenseRenewal")}
										</SelectItem>
										<SelectItem value="onboarding">
											{t("onboarding")}
										</SelectItem>
										<SelectItem value="audit">{t("audit")}</SelectItem>
										<SelectItem value="document_review">
											{t("documentReview")}
										</SelectItem>
										<SelectItem value="custom">{t("custom")}</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label className="text-xs font-medium">
									{t("triggerType")}
								</Label>
								<Select value={trigger} onValueChange={onTriggerChange}>
									<SelectTrigger className="h-9 text-sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="manual">{t("manual")}</SelectItem>
										<SelectItem value="automatic">{t("automatic")}</SelectItem>
										<SelectItem value="scheduled">{t("scheduled")}</SelectItem>
										<SelectItem value="event">{t("event")}</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<Separator className="opacity-50" />

						{/* Workflow Builder */}
						<WorkflowBuilder
							steps={steps}
							onChange={onStepsChange}
							selectedStepId={selectedStepId}
							onSelectStep={onSelectStep}
						/>
					</div>
				</ScrollArea>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("cancel")}
					</Button>
					<Button
						onClick={onSave}
						disabled={!name.trim()}
						className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
					>
						{t("saveWorkflow")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
