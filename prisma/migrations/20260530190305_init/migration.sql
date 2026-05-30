-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeType" TEXT NOT NULL DEFAULT 'general',
    "primaryState" TEXT NOT NULL DEFAULT 'CA',
    "plan" TEXT NOT NULL DEFAULT 'free',
    "parentId" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#10b981',
    "companyName" TEXT,
    "brandingConfig" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgMember" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),

    CONSTRAINT "OrgMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "state" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "isRenewed" BOOLEAN NOT NULL DEFAULT false,
    "renewalDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "renewalHistory" TEXT,
    "locationId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertPreference" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alert60Days" BOOLEAN NOT NULL DEFAULT true,
    "alert30Days" BOOLEAN NOT NULL DEFAULT true,
    "alert5Days" BOOLEAN NOT NULL DEFAULT true,
    "alertEmail" BOOLEAN NOT NULL DEFAULT true,
    "alertInApp" BOOLEAN NOT NULL DEFAULT true,
    "alertEmailFrequency" TEXT NOT NULL DEFAULT 'immediate',
    "alertEmailCategories" TEXT NOT NULL DEFAULT 'all',

    CONSTRAINT "AlertPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceShare" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiChatMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseDocument" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicenseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CETracking" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "hoursEarned" DOUBLE PRECISION NOT NULL,
    "hoursRequired" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completionDate" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "certificateUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CETracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceBond" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'insurance',
    "policyNumber" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "coverageAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "premiumAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "holderName" TEXT,
    "beneficiaries" TEXT,
    "documentUrl" TEXT,
    "notes" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "additionalInsured" BOOLEAN NOT NULL DEFAULT false,
    "primaryNoncontrib" BOOLEAN NOT NULL DEFAULT false,
    "waiverSubrogation" BOOLEAN NOT NULL DEFAULT false,
    "perOccurrenceLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aggregateLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductible" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "endorsementTypes" TEXT,
    "requiredCoverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requiredPerOccurrence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requiredAggregate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requiredEndorsements" TEXT,
    "complianceStatus" TEXT NOT NULL DEFAULT 'pending',
    "lastVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceBond_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StateRequirement" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL,
    "renewPeriodMonths" INTEGER NOT NULL DEFAULT 24,
    "ceHoursRequired" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "renewalFeeMin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "renewalFeeMax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bondRequired" BOOLEAN NOT NULL DEFAULT false,
    "bondAmountMin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insuranceRequired" BOOLEAN NOT NULL DEFAULT false,
    "boardName" TEXT,
    "boardUrl" TEXT,
    "boardPhone" TEXT,
    "notes" TEXT,
    "reciprocityStates" TEXT,
    "nasclaAccepted" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StateRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Qualifier" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "licenseNumber" TEXT,
    "licenseState" TEXT,
    "licenseType" TEXT,
    "licenseExpiry" TIMESTAMP(3),
    "ceHoursEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ceHoursRequired" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Qualifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualifierLicense" (
    "id" TEXT NOT NULL,
    "qualifierId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'qualifier',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualifierLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "clientName" TEXT,
    "clientEmail" TEXT,
    "location" TEXT,
    "state" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "requiredLicenses" TEXT,
    "requiredInsurance" TEXT,
    "complianceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectLicense" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ProjectLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSubcontractor" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "subcontractorId" TEXT NOT NULL,
    "role" TEXT,
    "complianceStatus" TEXT NOT NULL DEFAULT 'pending',
    "lastChecked" TIMESTAMP(3),

    CONSTRAINT "ProjectSubcontractor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcontractor" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "licenseNumber" TEXT,
    "licenseState" TEXT,
    "licenseExpiry" TIMESTAMP(3),
    "insuranceExpiry" TIMESTAMP(3),
    "insuranceStatus" TEXT NOT NULL DEFAULT 'unknown',
    "complianceStatus" TEXT NOT NULL DEFAULT 'pending',
    "status" TEXT NOT NULL DEFAULT 'active',
    "uploadToken" TEXT,
    "portalToken" TEXT,
    "portalExpiresAt" TIMESTAMP(3),
    "lastSubmittedAt" TIMESTAMP(3),
    "tradeType" TEXT,
    "insuranceProvider" TEXT,
    "insuranceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subcontractor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalWorkflow" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'license_renewal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "entityId" TEXT,
    "entityType" TEXT,
    "requestData" TEXT,
    "requestedBy" TEXT,
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "permissions" TEXT NOT NULL DEFAULT 'read',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRun" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'full_check',
    "status" TEXT NOT NULL DEFAULT 'running',
    "results" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubcontractorDocument" (
    "id" TEXT NOT NULL,
    "subcontractorId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubcontractorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL DEFAULT 'smtp',
    "providerId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationSetting" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "checkFrequency" TEXT NOT NULL DEFAULT 'daily',
    "escalationDays" INTEGER NOT NULL DEFAULT 7,
    "notifyExpired" BOOLEAN NOT NULL DEFAULT true,
    "notifyExpiring" BOOLEAN NOT NULL DEFAULT true,
    "notifyInsurance" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseApplication" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "licenseType" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "businessName" TEXT,
    "applicationType" TEXT NOT NULL DEFAULT 'new',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "boardName" TEXT,
    "boardUrl" TEXT,
    "submittedDate" TIMESTAMP(3),
    "targetDate" TIMESTAMP(3),
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "denialReason" TEXT,
    "checklistData" TEXT,
    "formData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicenseApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseApplicationDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicenseApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTemplate" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "items" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistInstance" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "items" TEXT NOT NULL,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentScan" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'auto',
    "extractedData" TEXT NOT NULL,
    "rawText" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamTracking" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "qualifierId" TEXT,
    "examType" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "examProvider" TEXT,
    "state" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "examDate" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "passingScore" DOUBLE PRECISION,
    "resultsReceived" TIMESTAMP(3),
    "registrationId" TEXT,
    "studyHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "certificateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessEntity" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entityType" TEXT NOT NULL DEFAULT 'llc',
    "formationState" TEXT,
    "formationDate" TIMESTAMP(3),
    "ein" TEXT,
    "registeredAgent" TEXT,
    "registeredAgentState" TEXT,
    "entityStatus" TEXT NOT NULL DEFAULT 'active',
    "annualReportDue" TIMESTAMP(3),
    "annualReportFiled" TIMESTAMP(3),
    "franchiseTaxDue" TIMESTAMP(3),
    "franchiseTaxPaid" TIMESTAMP(3),
    "complianceScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "notes" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityLicense" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'holder',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowDefinition" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'custom',
    "triggerType" TEXT NOT NULL DEFAULT 'manual',
    "triggerConfig" TEXT,
    "steps" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowInstance" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "stepHistory" TEXT,
    "variables" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryAlert" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "licenseType" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "changeType" TEXT NOT NULL DEFAULT 'update',
    "severity" TEXT NOT NULL DEFAULT 'info',
    "sourceUrl" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegulatoryAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryWatch" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "licenseType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastChecked" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegulatoryWatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "template" TEXT NOT NULL,
    "inputData" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'html',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureRequest" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "documentTitle" TEXT NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'general',
    "documentUrl" TEXT,
    "documentContent" TEXT,
    "requestedById" TEXT,
    "requestedToName" TEXT NOT NULL,
    "requestedToEmail" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "signingToken" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "declinedReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "signatureData" TEXT,
    "signerName" TEXT,
    "signerTitle" TEXT,
    "witnessName" TEXT,
    "witnessEmail" TEXT,
    "auditTrail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignatureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractorDirectory" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradeType" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "licenseState" TEXT,
    "licenseStatus" TEXT NOT NULL DEFAULT 'unknown',
    "licenseExpiry" TIMESTAMP(3),
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "website" TEXT,
    "insuranceProvider" TEXT,
    "insuranceExpiry" TIMESTAMP(3),
    "insuranceStatus" TEXT NOT NULL DEFAULT 'unknown',
    "bondingCapacity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "complianceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalProjects" INTEGER NOT NULL DEFAULT 0,
    "completedProjects" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "specialties" TEXT,
    "certifications" TEXT,
    "serviceAreas" TEXT,
    "yearsInBusiness" INTEGER NOT NULL DEFAULT 0,
    "employeeCount" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "tags" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractorDirectory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "config" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "syncCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSyncLog" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "IntegrationSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardSubmission" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "submissionType" TEXT NOT NULL,
    "licenseId" TEXT,
    "qualifierId" TEXT,
    "state" TEXT NOT NULL,
    "boardName" TEXT NOT NULL,
    "boardEmail" TEXT,
    "boardPortalUrl" TEXT,
    "applicationForm" TEXT,
    "supportingDocs" TEXT,
    "coverLetter" TEXT,
    "submissionData" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "trackingNumber" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "responseDate" TIMESTAMP(3),
    "boardResponse" TEXT,
    "filingFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feePaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentRef" TEXT,
    "estimatedDays" INTEGER NOT NULL DEFAULT 30,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "notes" TEXT,
    "checklistData" TEXT,
    "auditTrail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorScore" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "subcontractorId" TEXT,
    "vendorName" TEXT NOT NULL,
    "vendorEmail" TEXT,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "licenseScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insuranceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "documentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "complianceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "experienceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "responsivenessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "licenseVerified" BOOLEAN NOT NULL DEFAULT false,
    "licenseExpiry" TIMESTAMP(3),
    "licenseState" TEXT,
    "licenseType" TEXT,
    "insuranceVerified" BOOLEAN NOT NULL DEFAULT false,
    "insuranceExpiry" TIMESTAMP(3),
    "coiOnFile" BOOLEAN NOT NULL DEFAULT false,
    "endorsementStatus" TEXT NOT NULL DEFAULT 'unknown',
    "requiredDocs" INTEGER NOT NULL DEFAULT 0,
    "submittedDocs" INTEGER NOT NULL DEFAULT 0,
    "expiredDocs" INTEGER NOT NULL DEFAULT 0,
    "totalProjects" INTEGER NOT NULL DEFAULT 0,
    "completedProjects" INTEGER NOT NULL DEFAULT 0,
    "onTimeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgResponseDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "docRequestCount" INTEGER NOT NULL DEFAULT 0,
    "docResponseCount" INTEGER NOT NULL DEFAULT 0,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "lastAssessment" TIMESTAMP(3),
    "nextAssessment" TIMESTAMP(3),
    "assessmentHistory" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledReport" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'monthly',
    "recipients" TEXT NOT NULL,
    "reportType" TEXT NOT NULL DEFAULT 'compliance',
    "format" TEXT NOT NULL DEFAULT 'pdf',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OrgMember_orgId_email_key" ON "OrgMember"("orgId", "email");

-- CreateIndex
CREATE INDEX "License_orgId_idx" ON "License"("orgId");

-- CreateIndex
CREATE INDEX "License_expirationDate_idx" ON "License"("expirationDate");

-- CreateIndex
CREATE UNIQUE INDEX "AlertPreference_orgId_userId_key" ON "AlertPreference"("orgId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceShare_token_key" ON "ComplianceShare"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "CETracking_orgId_idx" ON "CETracking"("orgId");

-- CreateIndex
CREATE INDEX "CETracking_licenseId_idx" ON "CETracking"("licenseId");

-- CreateIndex
CREATE INDEX "InsuranceBond_orgId_idx" ON "InsuranceBond"("orgId");

-- CreateIndex
CREATE INDEX "InsuranceBond_expirationDate_idx" ON "InsuranceBond"("expirationDate");

-- CreateIndex
CREATE UNIQUE INDEX "StateRequirement_state_licenseType_key" ON "StateRequirement"("state", "licenseType");

-- CreateIndex
CREATE INDEX "Qualifier_orgId_idx" ON "Qualifier"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "QualifierLicense_qualifierId_licenseId_key" ON "QualifierLicense"("qualifierId", "licenseId");

-- CreateIndex
CREATE INDEX "Project_orgId_idx" ON "Project"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectLicense_projectId_licenseId_key" ON "ProjectLicense"("projectId", "licenseId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSubcontractor_projectId_subcontractorId_key" ON "ProjectSubcontractor"("projectId", "subcontractorId");

-- CreateIndex
CREATE INDEX "Subcontractor_orgId_idx" ON "Subcontractor"("orgId");

-- CreateIndex
CREATE INDEX "Subcontractor_portalToken_idx" ON "Subcontractor"("portalToken");

-- CreateIndex
CREATE INDEX "ApprovalWorkflow_orgId_idx" ON "ApprovalWorkflow"("orgId");

-- CreateIndex
CREATE INDEX "ApprovalWorkflow_status_idx" ON "ApprovalWorkflow"("status");

-- CreateIndex
CREATE INDEX "ApiKey_orgId_idx" ON "ApiKey"("orgId");

-- CreateIndex
CREATE INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "Webhook_orgId_idx" ON "Webhook"("orgId");

-- CreateIndex
CREATE INDEX "AutomationRun_orgId_idx" ON "AutomationRun"("orgId");

-- CreateIndex
CREATE INDEX "AutomationRun_startedAt_idx" ON "AutomationRun"("startedAt");

-- CreateIndex
CREATE INDEX "SubcontractorDocument_subcontractorId_idx" ON "SubcontractorDocument"("subcontractorId");

-- CreateIndex
CREATE INDEX "SubcontractorDocument_orgId_idx" ON "SubcontractorDocument"("orgId");

-- CreateIndex
CREATE INDEX "EmailLog_orgId_idx" ON "EmailLog"("orgId");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationSetting_orgId_key" ON "AutomationSetting"("orgId");

-- CreateIndex
CREATE INDEX "LicenseApplication_orgId_idx" ON "LicenseApplication"("orgId");

-- CreateIndex
CREATE INDEX "LicenseApplication_status_idx" ON "LicenseApplication"("status");

-- CreateIndex
CREATE INDEX "LicenseApplicationDocument_applicationId_idx" ON "LicenseApplicationDocument"("applicationId");

-- CreateIndex
CREATE INDEX "ChecklistTemplate_orgId_idx" ON "ChecklistTemplate"("orgId");

-- CreateIndex
CREATE INDEX "ChecklistInstance_orgId_idx" ON "ChecklistInstance"("orgId");

-- CreateIndex
CREATE INDEX "ChecklistInstance_entityType_entityId_idx" ON "ChecklistInstance"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "DocumentScan_orgId_idx" ON "DocumentScan"("orgId");

-- CreateIndex
CREATE INDEX "ExamTracking_orgId_idx" ON "ExamTracking"("orgId");

-- CreateIndex
CREATE INDEX "ExamTracking_examType_idx" ON "ExamTracking"("examType");

-- CreateIndex
CREATE INDEX "ExamTracking_status_idx" ON "ExamTracking"("status");

-- CreateIndex
CREATE INDEX "BusinessEntity_orgId_idx" ON "BusinessEntity"("orgId");

-- CreateIndex
CREATE INDEX "BusinessEntity_entityStatus_idx" ON "BusinessEntity"("entityStatus");

-- CreateIndex
CREATE UNIQUE INDEX "EntityLicense_entityId_licenseId_key" ON "EntityLicense"("entityId", "licenseId");

-- CreateIndex
CREATE INDEX "WorkflowDefinition_orgId_idx" ON "WorkflowDefinition"("orgId");

-- CreateIndex
CREATE INDEX "WorkflowDefinition_category_idx" ON "WorkflowDefinition"("category");

-- CreateIndex
CREATE INDEX "WorkflowInstance_orgId_idx" ON "WorkflowInstance"("orgId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_status_idx" ON "WorkflowInstance"("status");

-- CreateIndex
CREATE INDEX "WorkflowInstance_definitionId_idx" ON "WorkflowInstance"("definitionId");

-- CreateIndex
CREATE INDEX "RegulatoryAlert_orgId_idx" ON "RegulatoryAlert"("orgId");

-- CreateIndex
CREATE INDEX "RegulatoryAlert_state_idx" ON "RegulatoryAlert"("state");

-- CreateIndex
CREATE INDEX "RegulatoryAlert_isRead_idx" ON "RegulatoryAlert"("isRead");

-- CreateIndex
CREATE INDEX "RegulatoryAlert_createdAt_idx" ON "RegulatoryAlert"("createdAt");

-- CreateIndex
CREATE INDEX "RegulatoryWatch_orgId_idx" ON "RegulatoryWatch"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "RegulatoryWatch_orgId_state_licenseType_key" ON "RegulatoryWatch"("orgId", "state", "licenseType");

-- CreateIndex
CREATE INDEX "GeneratedDocument_orgId_idx" ON "GeneratedDocument"("orgId");

-- CreateIndex
CREATE INDEX "GeneratedDocument_createdAt_idx" ON "GeneratedDocument"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SignatureRequest_signingToken_key" ON "SignatureRequest"("signingToken");

-- CreateIndex
CREATE INDEX "SignatureRequest_orgId_idx" ON "SignatureRequest"("orgId");

-- CreateIndex
CREATE INDEX "SignatureRequest_signingToken_idx" ON "SignatureRequest"("signingToken");

-- CreateIndex
CREATE INDEX "SignatureRequest_status_idx" ON "SignatureRequest"("status");

-- CreateIndex
CREATE INDEX "ContractorDirectory_orgId_idx" ON "ContractorDirectory"("orgId");

-- CreateIndex
CREATE INDEX "ContractorDirectory_tradeType_idx" ON "ContractorDirectory"("tradeType");

-- CreateIndex
CREATE INDEX "ContractorDirectory_state_idx" ON "ContractorDirectory"("state");

-- CreateIndex
CREATE INDEX "ContractorDirectory_complianceScore_idx" ON "ContractorDirectory"("complianceScore");

-- CreateIndex
CREATE INDEX "Integration_orgId_idx" ON "Integration"("orgId");

-- CreateIndex
CREATE INDEX "Integration_type_idx" ON "Integration"("type");

-- CreateIndex
CREATE INDEX "IntegrationSyncLog_integrationId_idx" ON "IntegrationSyncLog"("integrationId");

-- CreateIndex
CREATE INDEX "IntegrationSyncLog_startedAt_idx" ON "IntegrationSyncLog"("startedAt");

-- CreateIndex
CREATE INDEX "BoardSubmission_orgId_idx" ON "BoardSubmission"("orgId");

-- CreateIndex
CREATE INDEX "BoardSubmission_state_idx" ON "BoardSubmission"("state");

-- CreateIndex
CREATE INDEX "BoardSubmission_status_idx" ON "BoardSubmission"("status");

-- CreateIndex
CREATE INDEX "BoardSubmission_submissionType_idx" ON "BoardSubmission"("submissionType");

-- CreateIndex
CREATE INDEX "VendorScore_orgId_idx" ON "VendorScore"("orgId");

-- CreateIndex
CREATE INDEX "VendorScore_riskLevel_idx" ON "VendorScore"("riskLevel");

-- CreateIndex
CREATE INDEX "VendorScore_overallScore_idx" ON "VendorScore"("overallScore");

-- CreateIndex
CREATE INDEX "ScheduledReport_orgId_idx" ON "ScheduledReport"("orgId");

-- CreateIndex
CREATE INDEX "ScheduledReport_enabled_idx" ON "ScheduledReport"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledReport_orgId_key" ON "ScheduledReport"("orgId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMember" ADD CONSTRAINT "OrgMember_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMember" ADD CONSTRAINT "OrgMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertPreference" ADD CONSTRAINT "AlertPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceShare" ADD CONSTRAINT "ComplianceShare_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseDocument" ADD CONSTRAINT "LicenseDocument_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseDocument" ADD CONSTRAINT "LicenseDocument_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CETracking" ADD CONSTRAINT "CETracking_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CETracking" ADD CONSTRAINT "CETracking_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceBond" ADD CONSTRAINT "InsuranceBond_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Qualifier" ADD CONSTRAINT "Qualifier_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualifierLicense" ADD CONSTRAINT "QualifierLicense_qualifierId_fkey" FOREIGN KEY ("qualifierId") REFERENCES "Qualifier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualifierLicense" ADD CONSTRAINT "QualifierLicense_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLicense" ADD CONSTRAINT "ProjectLicense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLicense" ADD CONSTRAINT "ProjectLicense_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSubcontractor" ADD CONSTRAINT "ProjectSubcontractor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSubcontractor" ADD CONSTRAINT "ProjectSubcontractor_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "Subcontractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcontractor" ADD CONSTRAINT "Subcontractor_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalWorkflow" ADD CONSTRAINT "ApprovalWorkflow_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubcontractorDocument" ADD CONSTRAINT "SubcontractorDocument_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "Subcontractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubcontractorDocument" ADD CONSTRAINT "SubcontractorDocument_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationSetting" ADD CONSTRAINT "AutomationSetting_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseApplication" ADD CONSTRAINT "LicenseApplication_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseApplicationDocument" ADD CONSTRAINT "LicenseApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "LicenseApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplate" ADD CONSTRAINT "ChecklistTemplate_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInstance" ADD CONSTRAINT "ChecklistInstance_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistInstance" ADD CONSTRAINT "ChecklistInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentScan" ADD CONSTRAINT "DocumentScan_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamTracking" ADD CONSTRAINT "ExamTracking_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamTracking" ADD CONSTRAINT "ExamTracking_qualifierId_fkey" FOREIGN KEY ("qualifierId") REFERENCES "Qualifier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessEntity" ADD CONSTRAINT "BusinessEntity_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessEntity" ADD CONSTRAINT "BusinessEntity_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BusinessEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityLicense" ADD CONSTRAINT "EntityLicense_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "BusinessEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityLicense" ADD CONSTRAINT "EntityLicense_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowDefinition" ADD CONSTRAINT "WorkflowDefinition_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "WorkflowDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryAlert" ADD CONSTRAINT "RegulatoryAlert_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryWatch" ADD CONSTRAINT "RegulatoryWatch_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureRequest" ADD CONSTRAINT "SignatureRequest_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractorDirectory" ADD CONSTRAINT "ContractorDirectory_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSyncLog" ADD CONSTRAINT "IntegrationSyncLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSyncLog" ADD CONSTRAINT "IntegrationSyncLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardSubmission" ADD CONSTRAINT "BoardSubmission_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorScore" ADD CONSTRAINT "VendorScore_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledReport" ADD CONSTRAINT "ScheduledReport_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
