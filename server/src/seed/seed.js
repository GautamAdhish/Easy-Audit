/**
 * Seeds the database with data equivalent to the frontend's static mock
 * files (src/data/*.ts), so the API and UI can be exercised end-to-end
 * without hand-typing test data.
 *
 * Usage:
 *   npm run seed          populate the database
 *   npm run seed:destroy  wipe every collection this script manages
 */
import dotenv from "dotenv";
dotenv.config();

import connectDB from "../config/db.js";
import generateCode from "../utils/generateCode.js";

import User from "../models/User.js";
import Audit from "../models/Audit.js";
import Finding from "../models/Finding.js";
import Capa from "../models/Capa.js";
import Risk from "../models/Risk.js";
import Vendor from "../models/Vendor.js";
import Asset from "../models/Asset.js";
import Evidence from "../models/Evidence.js";
import ChecklistItem from "../models/ChecklistItem.js";
import Report from "../models/Report.js";
import Settings from "../models/Settings.js";
import mongoose from "mongoose";

const DESTROY = process.argv.includes("--destroy");

const usersSeed = [
  {
    name: "Alice Chen",
    email: "alice.chen@company.com",
    role: "Lead Auditor",
    department: "IT",
    status: "Active",
  },
  {
    name: "Bob Martinez",
    email: "bob.m@company.com",
    role: "Auditor",
    department: "Legal",
    status: "Active",
  },
  {
    name: "Carol Singh",
    email: "carol.s@company.com",
    role: "Auditor",
    department: "Finance",
    status: "Active",
  },
  {
    name: "David Lee",
    email: "david.lee@company.com",
    role: "Auditor",
    department: "HR",
    status: "Active",
  },
  {
    name: "Eve Johnson",
    email: "eve.j@company.com",
    role: "Auditor",
    department: "Operations",
    status: "Active",
  },
  {
    name: "Frank Wu",
    email: "frank.wu@company.com",
    role: "Auditor",
    department: "Sales",
    status: "Active",
  },
  {
    name: "Grace Kim",
    email: "grace.kim@company.com",
    role: "Admin",
    department: "Operations",
    status: "Active",
  },
  {
    name: "Henry Patel",
    email: "henry.p@company.com",
    role: "Viewer",
    department: "Finance",
    status: "Inactive",
  },
];

const run = async () => {
  await connectDB();

  if (DESTROY) {
    await Promise.all([
      User.deleteMany(),
      Audit.deleteMany(),
      Finding.deleteMany(),
      Capa.deleteMany(),
      Risk.deleteMany(),
      Vendor.deleteMany(),
      Asset.deleteMany(),
      Evidence.deleteMany(),
      ChecklistItem.deleteMany(),
      Report.deleteMany(),
      Settings.deleteMany(),
      mongoose.connection.collection("counters").deleteMany({}),
    ]);
    console.log("All collections cleared.");
    process.exit(0);
  }

  // --- Users (including one seeded admin login) ---------------------------
  const defaultPassword = (
    process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!"
  ).trim();
  const users = {};
  for (const u of usersSeed) {
    const code = await generateCode("U");
    const password =
      u.email === (process.env.SEED_ADMIN_EMAIL || "admin@company.com").trim()
        ? defaultPassword
        : "Password123!";
    const doc = await User.create({ ...u, code, password });
    users[u.name] = doc;
  }
  // Ensure there's a guaranteed admin login using the configured seed credentials
  const adminEmail = (
    process.env.SEED_ADMIN_EMAIL || "admin@company.com"
  ).trim();
  if (!(await User.findOne({ email: adminEmail }))) {
    const code = await generateCode("U");
    await User.create({
      code,
      name: "System Admin",
      email: adminEmail,
      password: defaultPassword,
      role: "Admin",
      department: "IT",
      status: "Active",
    });
  }
  console.log(
    `Seeded ${usersSeed.length + 1} users. Admin login: ${adminEmail} / ${defaultPassword}`,
  );

  // --- Audits ---------------------------------------------------------------
  const auditsSeed = [
    {
      title: "ISO 27001 Annual Audit",
      department: "IT",
      auditor: "Alice Chen",
      status: "Completed",
      startDate: "2024-01-10",
      endDate: "2024-01-20",
      compliance: 91,
    },
    {
      title: "GDPR Compliance Review",
      department: "Legal",
      auditor: "Bob Martinez",
      status: "In Progress",
      startDate: "2024-02-05",
      endDate: "2024-02-15",
      compliance: 78,
    },
    {
      title: "Financial Controls Audit",
      department: "Finance",
      auditor: "Carol Singh",
      status: "Overdue",
      startDate: "2024-01-25",
      endDate: "2024-02-01",
      compliance: 65,
    },
    {
      title: "HR Policy Compliance",
      department: "HR",
      auditor: "David Lee",
      status: "Planned",
      startDate: "2024-03-01",
      endDate: "2024-03-10",
      compliance: 0,
    },
    {
      title: "Operations Safety Review",
      department: "Operations",
      auditor: "Eve Johnson",
      status: "Completed",
      startDate: "2024-01-15",
      endDate: "2024-01-22",
      compliance: 72,
    },
    {
      title: "Sales Data Handling Audit",
      department: "Sales",
      auditor: "Frank Wu",
      status: "In Progress",
      startDate: "2024-02-10",
      endDate: "2024-02-20",
      compliance: 68,
    },
    {
      title: "IT Security Patch Review",
      department: "IT",
      auditor: "Alice Chen",
      status: "Completed",
      startDate: "2024-01-28",
      endDate: "2024-02-03",
      compliance: 95,
    },
    {
      title: "Vendor Risk Assessment",
      department: "Operations",
      auditor: "Grace Kim",
      status: "Planned",
      startDate: "2024-03-05",
      endDate: "2024-03-15",
      compliance: 0,
    },
  ];
  const audits = [];
  for (const a of auditsSeed) {
    const code = await generateCode("A");
    const doc = await Audit.create({
      ...a,
      code,
      auditor: users[a.auditor]._id,
    });
    audits.push(doc);
  }
  console.log(`Seeded ${audits.length} audits.`);

  // --- Findings ---------------------------------------------------------------
  const findingsSeed = [
    {
      auditIdx: 0,
      title: "Unpatched server OS versions",
      department: "IT",
      severity: "Major",
      status: "Open",
      dateFound: "2024-01-15",
      dueDate: "2024-02-15",
      assignee: "Alice Chen",
      description:
        "Several production servers are running OS versions with known CVEs.",
    },
    {
      auditIdx: 0,
      title: "Missing MFA on admin accounts",
      department: "IT",
      severity: "Major",
      status: "In Review",
      dateFound: "2024-01-16",
      dueDate: "2024-02-10",
      assignee: "Bob Martinez",
      description:
        "Administrative accounts lack multi-factor authentication enforcement.",
    },
    {
      auditIdx: 1,
      title: "Consent records incomplete",
      department: "Legal",
      severity: "Minor",
      status: "Open",
      dateFound: "2024-02-07",
      dueDate: "2024-03-07",
      assignee: "Carol Singh",
      description:
        "GDPR consent records for EU customers are missing timestamps.",
    },
    {
      auditIdx: 2,
      title: "Expense approval bypassed on 3 items",
      department: "Finance",
      severity: "Major",
      status: "Open",
      dateFound: "2024-01-28",
      dueDate: "2024-02-14",
      assignee: "David Lee",
      description:
        "Three expense reports were approved without secondary sign-off.",
    },
    {
      auditIdx: 2,
      title: "Reconciliation delay >5 days",
      department: "Finance",
      severity: "Minor",
      status: "Closed",
      dateFound: "2024-01-29",
      dueDate: "2024-02-05",
      assignee: "Eve Johnson",
      description:
        "Monthly bank reconciliation was completed 6 days past deadline.",
    },
    {
      auditIdx: 4,
      title: "Fire extinguisher inspection overdue",
      department: "Operations",
      severity: "Major",
      status: "Open",
      dateFound: "2024-01-18",
      dueDate: "2024-01-25",
      assignee: "Frank Wu",
      description:
        "Quarterly fire extinguisher inspection was not conducted on schedule.",
    },
    {
      auditIdx: 4,
      title: "PPE not worn in restricted zone",
      department: "Operations",
      severity: "Observation",
      status: "Closed",
      dateFound: "2024-01-19",
      dueDate: "2024-02-01",
      assignee: "Grace Kim",
      description:
        "Staff observed in restricted zone without required PPE during site visit.",
    },
    {
      auditIdx: 5,
      title: "CRM access not revoked for ex-employee",
      department: "Sales",
      severity: "Major",
      status: "In Review",
      dateFound: "2024-02-12",
      dueDate: "2024-02-19",
      assignee: "Alice Chen",
      description:
        "Terminated employee still has active CRM login credentials.",
    },
  ];
  const findings = [];
  for (const f of findingsSeed) {
    const code = await generateCode("F");
    const doc = await Finding.create({
      ...f,
      code,
      auditId: audits[f.auditIdx]._id,
      assignee: users[f.assignee]._id,
    });
    findings.push(doc);
  }
  console.log(`Seeded ${findings.length} findings.`);

  // --- CAPAs ---------------------------------------------------------------
  const capasSeed = [
    {
      findingIdx: 0,
      title: "OS Patching Schedule Implementation",
      rootCause: "No formal patch management policy in place.",
      correctiveAction: "Apply all critical patches within 30 days.",
      preventiveAction:
        "Implement automated patch scanning and monthly review cycle.",
      owner: "Alice Chen",
      dueDate: "2024-02-15",
      status: "In Progress",
      priority: "High",
    },
    {
      findingIdx: 1,
      title: "MFA Enforcement for Admin Accounts",
      rootCause: "Policy exists but was not enforced technically.",
      correctiveAction: "Enable MFA on all admin accounts immediately.",
      preventiveAction: "Add MFA compliance check to onboarding checklist.",
      owner: "Bob Martinez",
      dueDate: "2024-02-10",
      status: "In Progress",
      priority: "High",
    },
    {
      findingIdx: 2,
      title: "GDPR Consent Record Remediation",
      rootCause: "Legacy consent form did not capture timestamps.",
      correctiveAction: "Backfill timestamps from server logs where possible.",
      preventiveAction:
        "Update consent form to auto-capture timestamp on submission.",
      owner: "Carol Singh",
      dueDate: "2024-03-07",
      status: "Open",
      priority: "Medium",
    },
    {
      findingIdx: 3,
      title: "Expense Approval Control Fix",
      rootCause: "Approval workflow allowed bypass for amounts under $500.",
      correctiveAction:
        "Audit all bypassed approvals and obtain retroactive sign-off.",
      preventiveAction: "Remove bypass rule from expense system configuration.",
      owner: "David Lee",
      dueDate: "2024-02-14",
      status: "Open",
      priority: "High",
    },
    {
      findingIdx: 5,
      title: "Fire Extinguisher Inspection Catch-up",
      rootCause: "Scheduled inspection was not on facility calendar.",
      correctiveAction: "Conduct overdue inspection immediately.",
      preventiveAction: "Add recurring calendar reminder for facility manager.",
      owner: "Eve Johnson",
      dueDate: "2024-01-30",
      status: "Verified",
      priority: "High",
    },
    {
      findingIdx: 7,
      title: "Revoke Terminated Employee CRM Access",
      rootCause: "IT offboarding checklist was not followed.",
      correctiveAction: "Immediately disable the CRM account.",
      preventiveAction:
        "Integrate HR termination workflow with IT access revocation.",
      owner: "Frank Wu",
      dueDate: "2024-02-19",
      status: "Closed",
      priority: "High",
    },
  ];
  for (const c of capasSeed) {
    const code = await generateCode("C");
    await Capa.create({
      ...c,
      code,
      findingId: findings[c.findingIdx]._id,
      owner: users[c.owner]._id,
    });
  }
  console.log(`Seeded ${capasSeed.length} CAPAs.`);

  // --- Risks ---------------------------------------------------------------
  const risksSeed = [
    {
      title: "Ransomware Attack on Core Systems",
      category: "Cyber Security",
      likelihood: 4,
      impact: 5,
      owner: "Alice Chen",
      status: "Open",
      mitigationPlan:
        "Deploy EDR solution and implement daily encrypted backups.",
    },
    {
      title: "Data Breach via Third-Party Vendor",
      category: "Data Privacy",
      likelihood: 3,
      impact: 5,
      owner: "Bob Martinez",
      status: "Mitigated",
      mitigationPlan: "Enforce vendor security assessments and DPA agreements.",
    },
    {
      title: "Regulatory Non-Compliance (GDPR)",
      category: "Compliance",
      likelihood: 3,
      impact: 4,
      owner: "Carol Singh",
      status: "Open",
      mitigationPlan: "Complete GDPR gap analysis and appoint DPO.",
    },
    {
      title: "Insider Threat — Privileged Access",
      category: "Access Control",
      likelihood: 2,
      impact: 5,
      owner: "David Lee",
      status: "Open",
      mitigationPlan: "Implement PAM solution and quarterly access reviews.",
    },
    {
      title: "Physical Access to Server Room",
      category: "Physical Security",
      likelihood: 2,
      impact: 4,
      owner: "Eve Johnson",
      status: "Mitigated",
      mitigationPlan: "Install biometric access control and CCTV.",
    },
    {
      title: "Software Vulnerability Exploitation",
      category: "Cyber Security",
      likelihood: 3,
      impact: 3,
      owner: "Frank Wu",
      status: "Open",
      mitigationPlan: "Adopt vulnerability scanning tool and patch within SLA.",
    },
    {
      title: "Business Continuity Plan Failure",
      category: "Operational",
      likelihood: 2,
      impact: 4,
      owner: "Grace Kim",
      status: "Accepted",
      mitigationPlan: "Test BCP annually and update contact lists quarterly.",
    },
    {
      title: "Password Policy Non-Adherence",
      category: "Access Control",
      likelihood: 3,
      impact: 2,
      owner: "Alice Chen",
      status: "Closed",
      mitigationPlan: "Enforce password complexity rules via AD Group Policy.",
    },
  ];
  for (const r of risksSeed) {
    const code = await generateCode("R");
    await Risk.create({ ...r, code, owner: users[r.owner]._id });
  }
  console.log(`Seeded ${risksSeed.length} risks.`);

  // --- Assets ---------------------------------------------------------------
  const assetsSeed = [
    {
      assetName: "Core Domain Controller",
      assetTag: "IT-SRV-001",
      category: "Hardware",
      location: "HQ Data Center, Rack A3",
      department: "IT",
      condition: "Good",
      assessmentStatus: "Pass",
      assessedBy: "Alice Chen",
      assessmentDate: "2024-01-18",
      notes: "Firmware up to date, redundant PSU healthy.",
    },
    {
      assetName: "Firewall Appliance — Perimeter",
      assetTag: "IT-NET-004",
      category: "Hardware",
      location: "HQ Data Center, Rack A1",
      department: "IT",
      condition: "Fair",
      assessmentStatus: "Needs Review",
      assessedBy: "Alice Chen",
      assessmentDate: "2024-01-19",
      notes:
        "Firmware two versions behind vendor latest — schedule upgrade window.",
    },
    {
      assetName: "Employee Laptop Fleet — Sales",
      assetTag: "SLS-LT-012",
      category: "Equipment",
      location: "Sales Floor, 2nd Floor",
      department: "Sales",
      condition: "Poor",
      assessmentStatus: "Non-Compliant",
      assessedBy: "Frank Wu",
      assessmentDate: "2024-02-11",
      notes: "Disk encryption not enforced on 4 of 12 devices sampled.",
    },
    {
      assetName: "Server Room Access Control Panel",
      assetTag: "OPS-FAC-002",
      category: "Facility",
      location: "HQ Data Center Entrance",
      department: "Operations",
      condition: "Good",
      assessmentStatus: "Pass",
      assessedBy: "Eve Johnson",
      assessmentDate: "2024-01-17",
      notes: "Badge log reviewed, no anomalies.",
    },
    {
      assetName: "Backup Generator — Building B",
      assetTag: "OPS-FAC-007",
      category: "Facility",
      location: "Building B, Utility Room",
      department: "Operations",
      condition: "Fair",
      assessmentStatus: "Needs Review",
      assessedBy: "Eve Johnson",
      assessmentDate: "2024-01-17",
      notes: "Last load test overdue by 3 months.",
    },
    {
      assetName: "Fleet Delivery Van #3",
      assetTag: "OPS-VEH-003",
      category: "Vehicle",
      location: "Distribution Yard",
      department: "Operations",
      condition: "Good",
      assessmentStatus: "Pass",
      assessedBy: "Grace Kim",
      assessmentDate: "2024-01-22",
      notes: "Registration and insurance current.",
    },
    {
      assetName: "Finance Dept. Shredder",
      assetTag: "FIN-TL-009",
      category: "Tool",
      location: "Finance Office, 3rd Floor",
      department: "Finance",
      condition: "Excellent",
      assessmentStatus: "Pass",
      assessedBy: "Carol Singh",
      assessmentDate: "2024-01-29",
      notes: "Cross-cut, meets document destruction policy.",
    },
    {
      assetName: "HR Filing Cabinet (Locked)",
      assetTag: "HR-EQ-005",
      category: "Equipment",
      location: "HR Office, 1st Floor",
      department: "HR",
      condition: "Fair",
      assessmentStatus: "Non-Compliant",
      assessedBy: "David Lee",
      assessmentDate: "2024-01-24",
      notes: "Lock mechanism faulty — sensitive personnel files exposed.",
    },
    {
      assetName: "Legacy File Server (Decommission Pending)",
      assetTag: "IT-SRV-014",
      category: "Hardware",
      location: "HQ Data Center, Rack C2",
      department: "IT",
      condition: "Poor",
      assessmentStatus: "Retired",
      assessedBy: "Alice Chen",
      assessmentDate: "2024-01-10",
      notes: "Marked for decommission after data migration confirmed complete.",
    },
    {
      assetName: "Visitor Badge Printer",
      assetTag: "OPS-EQ-011",
      category: "Equipment",
      location: "Main Reception",
      department: "Operations",
      condition: "Good",
      assessmentStatus: "Pass",
      assessedBy: "Grace Kim",
      assessmentDate: "2024-01-23",
      notes: "",
    },
  ];
  for (const a of assetsSeed) {
    const code = await generateCode("AS");
    await Asset.create({ ...a, code, assessedBy: users[a.assessedBy]._id });
  }
  console.log(`Seeded ${assetsSeed.length} assets.`);

  // --- Vendors ---------------------------------------------------------------
  const vendorsSeed = [
    {
      vendorName: "CloudSecure Systems",
      vendorType: "Software",
      serviceDescription: "SIEM and log-management platform used by the SOC.",
      website: "https://cloudsecuresystems.example.com",
      country: "United States",
      primaryContactName: "Marcus Webb",
      email: "marcus.webb@cloudsecuresystems.example.com",
      businessOwner: "Alice Chen",
      contractEndDate: "2024-11-30",
      nextReviewDate: "2024-08-15",
      criticality: "Critical",
      dataAccessLevel: "Confidential",
      hostingModel: "SaaS",
      inherentRisk: "High",
      controlEffectiveness: "Strong",
      assessmentResult: "Approved",
      approvalStatus: "Approved",
      notes: "SOC 2 Type II report on file.",
    },
    {
      vendorName: "PayLink Processing",
      vendorType: "Financial",
      serviceDescription: "Payment gateway for customer invoicing.",
      website: "https://paylink.example.com",
      country: "United Kingdom",
      primaryContactName: "Fiona Reyes",
      email: "fiona.reyes@paylink.example.com",
      businessOwner: "Carol Singh",
      contractEndDate: "2024-09-01",
      nextReviewDate: "2024-07-01",
      criticality: "Critical",
      dataAccessLevel: "Payment Data",
      hostingModel: "Cloud Hosted",
      inherentRisk: "Critical",
      controlEffectiveness: "Adequate",
      assessmentResult: "Approved with Conditions",
      approvalStatus: "Approved",
      notes: "PCI DSS attestation renewal requested.",
    },
    {
      vendorName: "Meridian Legal Advisory",
      vendorType: "Consulting",
      serviceDescription: "Outside counsel for regulatory and contract review.",
      country: "United States",
      primaryContactName: "Daniel Cho",
      email: "daniel.cho@meridianlegal.example.com",
      businessOwner: "Bob Martinez",
      contractEndDate: "2025-01-15",
      nextReviewDate: "2024-10-01",
      criticality: "Medium",
      dataAccessLevel: "Confidential",
      hostingModel: "On-Premise",
      inherentRisk: "Medium",
      controlEffectiveness: "Strong",
      assessmentResult: "Approved",
      approvalStatus: "Approved",
      notes: "",
    },
    {
      vendorName: "SwiftFreight Logistics",
      vendorType: "Logistics",
      serviceDescription:
        "Warehousing and last-mile delivery for regional distribution.",
      country: "Canada",
      primaryContactName: "Priya Nair",
      email: "priya.nair@swiftfreight.example.com",
      businessOwner: "Eve Johnson",
      contractEndDate: "2024-12-20",
      nextReviewDate: "2024-09-20",
      criticality: "Medium",
      dataAccessLevel: "Internal",
      hostingModel: "On-Premise",
      inherentRisk: "Low",
      controlEffectiveness: "Adequate",
      assessmentResult: "Approved",
      approvalStatus: "Approved",
      notes: "",
    },
    {
      vendorName: "DataVault Backup Services",
      vendorType: "Service",
      serviceDescription:
        "Offsite encrypted backup and disaster-recovery hosting.",
      website: "https://datavault.example.com",
      country: "Germany",
      primaryContactName: "Lars Bergman",
      email: "lars.bergman@datavault.example.com",
      businessOwner: "Grace Kim",
      contractEndDate: "2024-06-30",
      nextReviewDate: "2024-06-01",
      criticality: "High",
      dataAccessLevel: "PII",
      hostingModel: "Hybrid",
      inherentRisk: "High",
      controlEffectiveness: "Weak",
      assessmentResult: "Remediation Required",
      approvalStatus: "Pending",
      notes:
        "Encryption-at-rest evidence still outstanding — flagged in last review.",
    },
  ];
  for (const v of vendorsSeed) {
    const code = await generateCode("V");
    await Vendor.create({
      ...v,
      code,
      businessOwner: users[v.businessOwner]._id,
    });
  }
  console.log(`Seeded ${vendorsSeed.length} vendors.`);

  // --- Evidence ---------------------------------------------------------------
  const evidenceSeed = [
    {
      title: "Information Security Policy v3.0",
      type: "Policy",
      auditIdx: 0,
      uploadedBy: "Alice Chen",
      uploadedDate: "2024-01-12",
      fileSize: "245 KB",
      tags: ["ISO 27001", "Policy", "ISMS"],
    },
    {
      title: "Risk Assessment Register 2024",
      type: "Record",
      auditIdx: 0,
      uploadedBy: "Alice Chen",
      uploadedDate: "2024-01-13",
      fileSize: "1.2 MB",
      tags: ["Risk", "Register", "2024"],
    },
    {
      title: "GDPR Data Processing Agreement",
      type: "Policy",
      auditIdx: 1,
      uploadedBy: "Bob Martinez",
      uploadedDate: "2024-02-06",
      fileSize: "412 KB",
      tags: ["GDPR", "Legal", "DPA"],
    },
    {
      title: "Staff Awareness Training Records",
      type: "Record",
      auditIdx: 0,
      uploadedBy: "Carol Singh",
      uploadedDate: "2024-01-20",
      fileSize: "890 KB",
      tags: ["Training", "Awareness", "HR"],
    },
    {
      title: "Penetration Testing Report Q4 2023",
      type: "Report",
      auditIdx: 6,
      uploadedBy: "Alice Chen",
      uploadedDate: "2024-01-30",
      fileSize: "3.4 MB",
      tags: ["PenTest", "Security", "IT"],
    },
    {
      title: "ISO 27001 Certificate 2023",
      type: "Certificate",
      auditIdx: 0,
      uploadedBy: "David Lee",
      uploadedDate: "2024-01-05",
      fileSize: "180 KB",
      tags: ["Certificate", "ISO", "Compliance"],
    },
    {
      title: "Business Continuity Plan v2.3",
      type: "Procedure",
      auditIdx: 4,
      uploadedBy: "Eve Johnson",
      uploadedDate: "2024-01-16",
      fileSize: "2.1 MB",
      tags: ["BCP", "Continuity", "Operations"],
    },
    {
      title: "Vendor Due Diligence Questionnaires",
      type: "Record",
      auditIdx: 7,
      uploadedBy: "Grace Kim",
      uploadedDate: "2024-02-01",
      fileSize: "760 KB",
      tags: ["Vendor", "Third-Party", "Supply Chain"],
    },
  ];
  for (const e of evidenceSeed) {
    const code = await generateCode("E");
    await Evidence.create({
      ...e,
      code,
      relatedAudit: audits[e.auditIdx]._id,
      uploadedBy: users[e.uploadedBy]._id,
    });
  }
  console.log(`Seeded ${evidenceSeed.length} evidence records.`);

  // --- Checklist ---------------------------------------------------------------
  const checklistSeed = [
    {
      clause: "4.1",
      title: "Understanding the organisation and its context",
      description:
        "Organisation has identified internal and external issues relevant to its purpose.",
      status: "Compliant",
      evidence: "Context analysis document v2.1",
      auditor: "Alice Chen",
    },
    {
      clause: "4.2",
      title: "Understanding needs and expectations of parties",
      description:
        "Interested parties and their requirements have been identified and documented.",
      status: "Compliant",
      evidence: "Stakeholder register 2024",
      auditor: "Alice Chen",
    },
    {
      clause: "5.1",
      title: "Leadership and commitment",
      description:
        "Top management demonstrates leadership and commitment to the ISMS.",
      status: "Partial",
      evidence: "Meeting minutes Q1 2024",
      auditor: "Bob Martinez",
    },
    {
      clause: "5.2",
      title: "Information security policy",
      description:
        "An IS policy has been established, approved, and communicated.",
      status: "Compliant",
      evidence: "IS Policy v3.0 signed",
      auditor: "Bob Martinez",
    },
    {
      clause: "6.1",
      title: "Actions to address risks and opportunities",
      description:
        "Risk assessment and treatment processes have been defined and implemented.",
      status: "Non-Compliant",
      evidence: "No formal risk register found",
      auditor: "Carol Singh",
    },
    {
      clause: "6.2",
      title: "Information security objectives",
      description:
        "IS objectives are established and plans exist to achieve them.",
      status: "Partial",
      evidence: "Objectives doc missing KPIs",
      auditor: "Carol Singh",
    },
    {
      clause: "7.2",
      title: "Competence",
      description:
        "Staff performing IS work are competent and records are maintained.",
      status: "Compliant",
      evidence: "Training records 2023-2024",
      auditor: "David Lee",
    },
    {
      clause: "8.1",
      title: "Operational planning and control",
      description:
        "Processes needed to meet IS requirements have been planned and controlled.",
      status: "Compliant",
      evidence: "Operations manual v1.4",
      auditor: "David Lee",
    },
    {
      clause: "9.1",
      title: "Monitoring, measurement, analysis and evaluation",
      description:
        "Performance and effectiveness of the ISMS is monitored and evaluated.",
      status: "Non-Compliant",
      evidence: "No monitoring metrics established",
      auditor: "Eve Johnson",
    },
    {
      clause: "9.2",
      title: "Internal audit",
      description: "Internal audits are conducted at planned intervals.",
      status: "Compliant",
      evidence: "Audit schedule 2024 approved",
      auditor: "Eve Johnson",
    },
    {
      clause: "10.1",
      title: "Nonconformity and corrective action",
      description:
        "Nonconformities are identified and corrective actions taken.",
      status: "Partial",
      evidence: "CAPA log — 3 items past due",
      auditor: "Frank Wu",
    },
    {
      clause: "10.2",
      title: "Continual improvement",
      description:
        "Organisation continually improves the suitability and effectiveness of ISMS.",
      status: "Compliant",
      evidence: "Management review minutes Jan 2024",
      auditor: "Frank Wu",
    },
  ];
  for (const c of checklistSeed) {
    const code = await generateCode("CL");
    await ChecklistItem.create({
      ...c,
      code,
      auditor: users[c.auditor]._id,
      auditId: audits[0]._id,
    });
  }
  console.log(`Seeded ${checklistSeed.length} checklist items.`);

  // --- Reports ---------------------------------------------------------------
  const reportsSeed = [
    {
      title: "Q4 2023 ISO 27001 Audit Summary",
      type: "Audit Summary",
      generatedBy: "Alice Chen",
      generatedDate: "2024-01-25",
      period: "Q4 2023",
      status: "Approved",
      pages: 24,
    },
    {
      title: "Annual Compliance Report 2023",
      type: "Compliance",
      generatedBy: "Bob Martinez",
      generatedDate: "2024-01-30",
      period: "FY 2023",
      status: "Final",
      pages: 48,
    },
    {
      title: "Risk Register Summary — Jan 2024",
      type: "Risk",
      generatedBy: "Carol Singh",
      generatedDate: "2024-02-01",
      period: "Jan 2024",
      status: "Approved",
      pages: 18,
    },
    {
      title: "CAPA Status Report — Q1 2024",
      type: "CAPA",
      generatedBy: "David Lee",
      generatedDate: "2024-02-10",
      period: "Q1 2024",
      status: "Draft",
      pages: 12,
    },
    {
      title: "Findings Tracker — February 2024",
      type: "Findings",
      generatedBy: "Eve Johnson",
      generatedDate: "2024-02-14",
      period: "Feb 2024",
      status: "Draft",
      pages: 9,
    },
    {
      title: "Vendor Risk Assessment Report",
      type: "Risk",
      generatedBy: "Grace Kim",
      generatedDate: "2024-02-05",
      period: "H2 2023",
      status: "Final",
      pages: 32,
    },
  ];
  for (const r of reportsSeed) {
    const code = await generateCode("RP");
    await Report.create({ ...r, code, generatedBy: users[r.generatedBy]._id });
  }
  console.log(`Seeded ${reportsSeed.length} reports.`);

  // --- Settings (defaults) ---------------------------------------------------
  await Settings.findOneAndUpdate(
    {},
    {},
    { upsert: true, setDefaultsOnInsert: true },
  );
  console.log("Settings initialised.");

  console.log("\nSeed complete.");
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
