-- Dynamic event forms: categories keep acting as event subcategories.

ALTER TABLE "Category" ADD COLUMN "formTemplateId" TEXT;
ALTER TABLE "Event" ADD COLUMN "customSubsubcategory" TEXT;

CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FormField" (
    "id" TEXT NOT NULL,
    "formTemplateId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "validationRules" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormField_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventFieldValue" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "formFieldId" TEXT NOT NULL,
    "value" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventFieldValue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FormTemplate_name_key" ON "FormTemplate"("name");
CREATE UNIQUE INDEX "FormField_formTemplateId_fieldName_key" ON "FormField"("formTemplateId", "fieldName");
CREATE UNIQUE INDEX "EventFieldValue_eventId_formFieldId_key" ON "EventFieldValue"("eventId", "formFieldId");
CREATE INDEX "Category_formTemplateId_idx" ON "Category"("formTemplateId");
CREATE INDEX "FormField_formTemplateId_displayOrder_idx" ON "FormField"("formTemplateId", "displayOrder");
CREATE INDEX "Event_customSubsubcategory_idx" ON "Event"("customSubsubcategory");
CREATE INDEX "EventFieldValue_eventId_idx" ON "EventFieldValue"("eventId");
CREATE INDEX "EventFieldValue_formFieldId_idx" ON "EventFieldValue"("formFieldId");

ALTER TABLE "Category" ADD CONSTRAINT "Category_formTemplateId_fkey" FOREIGN KEY ("formTemplateId") REFERENCES "FormTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_formTemplateId_fkey" FOREIGN KEY ("formTemplateId") REFERENCES "FormTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventFieldValue" ADD CONSTRAINT "EventFieldValue_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventFieldValue" ADD CONSTRAINT "EventFieldValue_formFieldId_fkey" FOREIGN KEY ("formFieldId") REFERENCES "FormField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
