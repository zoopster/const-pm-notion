# Construction Project Management - Database Schema Specification

## Overview
This document specifies the construction-specific database structure adapted from the Pipeline Management MVP, tailored for construction companies, contractors, and project managers using Notion's API for automated deployment.

## Database Architecture

### 1. Projects Database (Core Pipeline)
**Purpose**: Construction project tracking with material, permit, and inspection management
**Primary View**: Kanban Board by Status with construction-specific stages

#### Properties:

| Property Name | Type | Required | Description | Formula/Options |
|---------------|------|----------|-------------|----------------|
| Project Title | Title | Yes | Primary project identifier | Auto-generated from client + project type |
| Status | Select | Yes | Current project stage | Planning, Permits, Scheduled, Construction, Inspection, Complete, Warranty |
| Client | Relation | Yes | Links to Clients database | Single relation to Clients |
| Project Type | Select | Yes | Construction category | Residential New, Commercial Build, Renovation, Addition, Repair, Emergency |
| Priority | Select | No | Project urgency | High (Red), Medium (Yellow), Low (Green) |
| Project Manager | Person | No | PM responsible | Single person assignment |
| Lead Contractor | Relation | No | Links to Team Members | Primary contractor assignment |
| Created Date | Created Time | Auto | Project creation date | System generated |
| Start Date | Date | No | Construction start date | User input |
| Completion Date | Date | No | Target completion | User input |
| Contract Value | Number | Yes | Total project value | Currency format |
| Current Costs | Number | No | Actual costs to date | Currency format |
| Change Orders Total | Number | No | Sum of all change orders | Auto-calculated |
| Permits Required | Multi-select | No | Required permit types | Building, Electrical, Plumbing, HVAC, Excavation, Roofing |
| Permits Status | Formula | Auto | Permit approval status | Based on permit tracking |
| Inspection Status | Select | No | Current inspection phase | Not Started, Scheduled, Passed, Failed, Re-inspection |
| Safety Compliance | Select | No | Safety status | Compliant, Minor Issues, Major Issues, Critical |
| Weather Dependency | Checkbox | No | Weather sensitive work | Boolean flag |
| Address | Rich Text | Yes | Project location | Full address |
| Coordinates | Rich Text | No | GPS coordinates | For mobile navigation |

#### Construction-Specific Formulas:

| Property Name | Type | Formula |
|---------------|------|---------|
| Days in Stage | Formula | `dateBetween(now(), prop("Status Changed"), "days")` |
| Behind Schedule | Formula | `and(prop("Completion Date"), prop("Completion Date") < now(), prop("Status") != "Complete", prop("Status") != "Warranty")` |
| Budget Variance | Formula | `if(prop("Contract Value") > 0, ((prop("Current Costs") + prop("Change Orders Total")) - prop("Contract Value")) / prop("Contract Value") * 100, 0)` |
| Project Health | Formula | `if(prop("Budget Variance") > 15, "🔴 Over Budget", if(prop("Behind Schedule"), "🟡 Behind Schedule", if(prop("Safety Compliance") == "Critical", "🚨 Safety Issue", "🟢 On Track")))` |
| Profit Margin | Formula | `if(prop("Contract Value") > 0, (prop("Contract Value") - prop("Current Costs") - prop("Change Orders Total")) / prop("Contract Value") * 100, 0)` |

---

### 2. Materials Database
**Purpose**: Material tracking, procurement, and inventory management
**Primary View**: Table view with delivery tracking

#### Properties:

| Property Name | Type | Required | Description | Formula/Options |
|---------------|------|----------|-------------|----------------|
| Material Name | Title | Yes | Material/product name | Primary identifier |
| Project | Relation | Yes | Links to Projects database | Single relation |
| Category | Select | Yes | Material type | Lumber, Concrete, Steel, Electrical, Plumbing, HVAC, Roofing, Flooring, Insulation, Drywall, Paint, Hardware |
| Supplier | Relation | No | Links to Suppliers database | Vendor information |
| Quantity Ordered | Number | Yes | Amount ordered | With units |
| Unit | Select | Yes | Measurement unit | Linear Feet, Square Feet, Cubic Yards, Each, Tons, Pallets, Boxes |
| Unit Cost | Number | Yes | Cost per unit | Currency format |
| Total Cost | Formula | Auto | Calculated total | `prop("Quantity Ordered") * prop("Unit Cost")` |
| Order Date | Date | No | When order was placed | User input |
| Expected Delivery | Date | No | Scheduled delivery | User input |
| Actual Delivery | Date | No | When delivered | User input |
| Status | Select | Yes | Order status | Ordered, In Transit, Delivered, Installed, Back-ordered |
| Quality Check | Select | No | Material inspection | Not Checked, Approved, Rejected, Returned |
| Storage Location | Text | No | Where material is stored | Site location reference |
| Notes | Rich Text | No | Special instructions | Long text field |

---

### 3. Subcontractors Database
**Purpose**: Subcontractor management and coordination
**Primary View**: Table view with availability and performance tracking

#### Properties:

| Property Name | Type | Required | Description | Formula/Options |
|---------------|------|----------|-------------|----------------|
| Company Name | Title | Yes | Subcontractor business name | Primary identifier |
| Contact Person | Text | Yes | Primary contact name | Contact name |
| Phone | Phone | Yes | Primary phone number | Phone format |
| Email | Email | No | Contact email | Email format |
| Specialty | Multi-select | Yes | Trade specialties | Electrical, Plumbing, HVAC, Roofing, Framing, Flooring, Painting, Landscaping, Excavation |
| License Number | Text | No | Professional license | License tracking |
| Insurance Expiry | Date | No | Insurance expiration | Date tracking |
| Rate | Number | No | Hourly or daily rate | Currency format |
| Availability | Select | No | Current availability | Available, Booked, Limited, Unavailable |
| Performance Rating | Select | No | Quality rating | Excellent, Good, Fair, Poor |
| Current Projects | Rollup | Auto | Active project count | Count from project assignments |
| Total Projects | Rollup | Auto | Historical project count | Count all assignments |
| Average Rating | Rollup | Auto | Performance average | Average of project ratings |
| Last Project Date | Rollup | Auto | Most recent work | Latest project date |
| Preferred | Checkbox | No | Preferred contractor | Boolean flag |
| Notes | Rich Text | No | Performance notes | Long text field |

---

### 4. Clients Database (Enhanced for Construction)
**Purpose**: Client relationship management with construction-specific fields
**Primary View**: Table view with project history

#### Properties:

| Property Name | Type | Required | Description | Formula/Options |
|---------------|------|----------|-------------|----------------|
| Client Name | Title | Yes | Client or company name | Primary identifier |
| Contact Person | Text | No | Primary contact | For companies |
| Phone | Phone | Yes | Primary phone number | Phone format |
| Email | Email | No | Contact email | Email format |
| Billing Address | Rich Text | No | Billing address | Multi-line text |
| Project Address | Rich Text | No | Construction address | If different from billing |
| Client Type | Select | No | Client category | Homeowner, Property Developer, Commercial, Government, Insurance |
| Lead Source | Select | No | How they found us | Referral, Website, Social Media, Trade Show, Repeat Client |
| Decision Maker | Text | No | Primary decision maker | Name and role |
| Budget Range | Select | No | Project budget tier | Under 50K, 50K-100K, 100K-250K, 250K-500K, 500K+ |
| Payment Terms | Select | No | Payment schedule | Net 30, Net 15, Progress Payments, COD |
| Credit Rating | Select | No | Credit worthiness | Excellent, Good, Fair, Poor, Unknown |
| Insurance Carrier | Text | No | Homeowner's insurance | For insurance claims |
| HOA Requirements | Checkbox | No | HOA approval needed | Boolean flag |
| Special Requirements | Rich Text | No | Project constraints | Access, timing, materials |

#### Client Rollups:

| Property Name | Type | Rollup Source | Calculate |
|---------------|------|---------------|----------|
| Total Projects | Rollup | Projects → Project Title | Count all |
| Active Projects | Rollup | Projects → Status | Count (not Complete/Warranty) |
| Total Value | Rollup | Projects → Contract Value | Sum |
| Last Project | Rollup | Projects → Created Date | Latest date |
| Client Health | Formula | Based on payment history and project success | Derived status |

---

### 5. Permits Database
**Purpose**: Permit tracking and compliance management
**Primary View**: Table view sorted by submission date

#### Properties:

| Property Name | Type | Required | Description | Formula/Options |
|---------------|------|----------|-------------|----------------|
| Permit ID | Title | Yes | Permit identifier | Auto-generated |
| Project | Relation | Yes | Links to Projects database | Single relation |
| Permit Type | Select | Yes | Type of permit | Building, Electrical, Plumbing, HVAC, Excavation, Roofing, Demolition, Occupancy |
| Jurisdiction | Text | Yes | Permitting authority | City/county office |
| Application Date | Date | No | When applied | User input |
| Submission Date | Date | No | When submitted | User input |
| Expected Approval | Date | No | Estimated approval date | User input |
| Approval Date | Date | No | When approved | User input |
| Permit Number | Text | No | Official permit number | From authority |
| Status | Select | Yes | Current status | Planning, Applied, Under Review, Approved, Rejected, Expired |
| Fee Amount | Number | No | Permit fee | Currency format |
| Expiry Date | Date | No | Permit expiration | User input |
| Inspector | Text | No | Assigned inspector | Inspector name |
| Requirements | Rich Text | No | Special requirements | Compliance notes |
| Documents | Files | No | Permit documents | File attachments |

---

### 6. Inspections Database
**Purpose**: Inspection scheduling and tracking
**Primary View**: Calendar view by inspection date

#### Properties:

| Property Name | Type | Required | Description | Formula/Options |
|---------------|------|----------|-------------|----------------|
| Inspection ID | Title | Yes | Inspection identifier | Auto-generated |
| Project | Relation | Yes | Links to Projects database | Single relation |
| Inspection Type | Select | Yes | Type of inspection | Foundation, Framing, Electrical, Plumbing, HVAC, Insulation, Drywall, Final |
| Scheduled Date | Date | Yes | Inspection appointment | User input |
| Inspector | Text | No | Inspector name | From jurisdiction |
| Status | Select | Yes | Inspection result | Scheduled, Passed, Failed, Partial Pass, Cancelled, Rescheduled |
| Passed Items | Rich Text | No | Items that passed | Checklist items |
| Failed Items | Rich Text | No | Items that failed | Failure details |
| Corrective Actions | Rich Text | No | Required corrections | Next steps |
| Re-inspection Date | Date | No | Follow-up inspection | If needed |
| Notes | Rich Text | No | Inspector comments | Additional details |
| Photos | Files | No | Inspection photos | Before/after images |

---

### 7. Safety Incidents Database
**Purpose**: Safety incident tracking and compliance
**Primary View**: Table view sorted by date

#### Properties:

| Property Name | Type | Required | Description | Formula/Options |
|---------------|------|----------|-------------|----------------|
| Incident ID | Title | Yes | Incident identifier | Auto-generated |
| Project | Relation | Yes | Links to Projects database | Single relation |
| Date | Date | Yes | Incident date | User input |
| Time | Text | No | Time of incident | Time field |
| Severity | Select | Yes | Incident severity | Minor, Moderate, Major, Critical |
| Type | Select | Yes | Incident category | Injury, Near Miss, Property Damage, Safety Violation, Environmental |
| Injured Person | Text | No | Person involved | Name if applicable |
| Description | Rich Text | Yes | Incident details | Full description |
| Immediate Action | Rich Text | No | Actions taken | Response details |
| Root Cause | Rich Text | No | Cause analysis | Investigation results |
| Preventive Actions | Rich Text | No | Prevention measures | Future prevention |
| Reported By | Person | Yes | Person reporting | Team member |
| OSHA Reportable | Checkbox | No | OSHA reporting required | Boolean flag |
| Status | Select | Yes | Investigation status | Open, Under Investigation, Closed |
| Photos | Files | No | Incident photos | Evidence images |

---

## Database Relations

### Primary Relations:
1. **Projects → Clients**: Many-to-One (each project has one client)
2. **Projects → Materials**: One-to-Many (project has many materials)
3. **Projects → Permits**: One-to-Many (project has multiple permits)
4. **Projects → Inspections**: One-to-Many (project has multiple inspections)
5. **Projects → Safety Incidents**: One-to-Many (project may have incidents)
6. **Projects → Subcontractors**: Many-to-Many (projects use multiple subs)
7. **Materials → Subcontractors**: Many-to-One (supplier relationship)

### Relation Configuration:
- **Projects.Client** → **Clients** (Show in Clients as "Projects")
- **Projects.Materials** → **Materials** (Show in Materials as "Project")
- **Projects.Permits** → **Permits** (Show in Permits as "Project")
- **Projects.Inspections** → **Inspections** (Show in Inspections as "Project")

---

## Construction Pipeline Stages

### 1. Planning Stage
- **Duration**: 1-4 weeks
- **Key Activities**: Design review, permit applications, material ordering
- **Required Fields**: Contract value, start date, permits required
- **Automation**: Auto-move when all permits submitted

### 2. Permits Stage
- **Duration**: 2-8 weeks
- **Key Activities**: Permit review, approval waiting, plan revisions
- **Required Fields**: Permit applications, submission dates
- **Automation**: Auto-move when all permits approved

### 3. Scheduled Stage
- **Duration**: 1-2 weeks
- **Key Activities**: Final material orders, crew scheduling, site prep
- **Required Fields**: Start date confirmed, materials ordered
- **Automation**: Auto-move when start date within 7 days

### 4. Construction Stage
- **Duration**: Varies by project
- **Key Activities**: Active construction, material deliveries, inspections
- **Required Fields**: Daily updates, material tracking, safety checks
- **Automation**: Alert if stage exceeds planned duration by 20%

### 5. Inspection Stage
- **Duration**: 1-3 weeks
- **Key Activities**: Final inspections, corrections, approval waiting
- **Required Fields**: Inspection scheduling, pass/fail tracking
- **Automation**: Auto-move when all inspections passed

### 6. Complete Stage
- **Duration**: 1 week
- **Key Activities**: Final walkthrough, punch list, client approval
- **Required Fields**: Client signoff, final photos, cleanup complete
- **Automation**: Auto-move to warranty when fully complete

### 7. Warranty Stage
- **Duration**: 1 year typical
- **Key Activities**: Warranty tracking, callback management
- **Required Fields**: Warranty terms, callback requests
- **Automation**: Archive after warranty period expires

---

## Mobile-Optimized Views

### 1. Field Worker Dashboard
- **Projects**: Today's Work (filtered by crew assignment and date)
- **Materials**: Delivery Tracking (expected deliveries today)
- **Safety**: Quick Incident Report (mobile-optimized form)
- **Photos**: Progress Documentation (camera integration)

### 2. Project Manager Dashboard
- **Projects**: Active Projects Overview (status, health, alerts)
- **Schedule**: Upcoming Inspections and Deliveries
- **Budget**: Cost Tracking and Variance Alerts
- **Team**: Crew Assignments and Availability

### 3. Client Portal Views
- **Project**: Current Project Status and Photos
- **Timeline**: Milestone tracking and upcoming activities
- **Budget**: Approved changes and current costs
- **Communication**: Message center and updates

---

This schema provides a comprehensive foundation for construction project management while maintaining the mobile-first approach and automation capabilities of the original pipeline system, specifically tailored for construction industry workflows and requirements.