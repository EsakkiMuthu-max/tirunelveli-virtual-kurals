// Hand-written mirrors of the backend's Pydantic models (backend/models/schemas.py) and of the
// Spring Boot DTOs in backend/src/main/java/com/tirunelveli/kural/dto/Dtos.java. Nothing infers
// across the language boundary — when a model changes, change its twin here in the same edit.

export interface Department {
  id: string;
  name: string;
  tamil_name: string;
  icon: string;
  description: string;
  officer_id: string;
}

export interface SessionUser {
  id: string;
  role: "citizen" | "officer";
  display_name: string;
  login_id: string;
  department_id: string | null;
  department_name: string | null;
}

export interface EvidenceCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

export interface Evidence {
  kind: "photo" | "video";
  filename: string;
  mime_type: string;
  size_bytes: number;
  has_geotag: boolean;
  latitude: number | null;
  longitude: number | null;
  captured_at: string | null;
  camera: string | null;
  authenticity_score: number;
  authenticity_verdict: string;
  signals: string[];
  checks: EvidenceCheck[];
  in_service_area: boolean;
}

export interface ComplaintUpdate {
  status: string;
  message: string;
  actor: string;
  created_at: string;
}

export type ComplaintStatus =
  | "submitted"
  | "under_review"
  | "in_progress"
  | "resolved"
  | "rejected";

export interface Complaint {
  id: string;
  reference: string;
  citizen_id: string;
  citizen_name: string;
  department_id: string;
  department_name: string;
  category: string;
  description: string;
  area: string;
  landmark: string | null;
  reporting_latitude: number | null;
  reporting_longitude: number | null;
  status: ComplaintStatus;
  priority: string;
  verification_status: "verified" | "needs_review" | "rejected";
  verification_note: string;
  rejection_reason: string | null;
  evidence: Evidence | null;
  updates: ComplaintUpdate[];
  created_at: string;
  updated_at: string;
}

export interface ComplaintStats {
  total: number;
  submitted: number;
  under_review: number;
  in_progress: number;
  resolved: number;
  rejected: number;
}
