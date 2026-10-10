import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import AppShell, { departmentIcon } from "@/components/AppShell";
import EvidenceAudit from "@/components/EvidenceAudit";
import CameraCapture from "@/components/CameraCapture";
import { checkCategory, loadCategoryModel, type CategoryCheckResult } from "@/lib/categoryCheck";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/useSession";
import { apiErrorMessage, apiGet, apiUpload } from "@/lib/api";
import type { Complaint, Department } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_BYTES = 30 * 1024 * 1024;

export default function ReportIssue() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoading } = useSession();

  const [departmentId, setDepartmentId] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [reportingLocation, setReportingLocation] = useState<{
    latitude: number;
    longitude: number;
    label: string;
  } | null>(null);
  const [locationMessage, setLocationMessage] = useState("Requesting your location…");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Complaint | null>(null);
  const [check, setCheck] = useState<CategoryCheckResult | null>(null);
  const [checking, setChecking] = useState(false);

  // Warm up the free in-browser AI model so the check is quick after capture.
  useEffect(() => {
    loadCategoryModel().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationMessage("Location detection is not supported here. Enter the area or ward manually.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const latitude = coords.latitude;
        const longitude = coords.longitude;
        let label = "";
        try {
          const url = new URL("https://nominatim.openstreetmap.org/reverse");
          url.search = new URLSearchParams({
            format: "jsonv2",
            lat: String(latitude),
            lon: String(longitude),
            zoom: "18",
          }).toString();
          const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
          if (response.ok) {
            const result = (await response.json()) as { address?: Record<string, string> };
            const address = result.address ?? {};
            label =
              address.suburb ??
              address.neighbourhood ??
              address.village ??
              address.town ??
              address.city_district ??
              address.city ??
              address.state_district ??
              "";
          }
        } catch {
          // Coordinates are still saved if the optional free reverse-geocoder is unavailable.
        }

        const fallback = `GPS ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        const resolvedLabel = label || fallback;
        setReportingLocation({ latitude, longitude, label: resolvedLabel });
        setArea((current) => (current.trim() ? current : resolvedLabel));
        setLocationMessage(
          `Location detected: ${resolvedLabel}. You can edit the area label; GPS coordinates will be saved with the report.`,
        );
      },
      () => setLocationMessage("Location permission was not granted. Enter the area or ward manually."),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 },
    );
  }, []);

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiGet<Department[]>("/departments"),
    retry: false,
    staleTime: Infinity,
  });

  const submit = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append("department_id", departmentId);
      form.append("description", description.trim());
      form.append("area", area.trim());
      form.append("landmark", landmark.trim());
      if (reportingLocation) {
        form.append("reporting_latitude", String(reportingLocation.latitude));
        form.append("reporting_longitude", String(reportingLocation.longitude));
      }
      form.append("evidence", file as File);
      if (check && check.match !== null) {
        form.append("ai_category_match", String(check.match));
        form.append("ai_category_confidence", String(check.confidence));
        form.append("ai_detected_label", check.detectedLabel);
      }
      return apiUpload<Complaint>("/complaints", form);
    },
    onSuccess: async (complaint) => {
      setResult(complaint);
      await queryClient.invalidateQueries({ queryKey: ["complaints"] });
      if (complaint.status === "rejected") {
        toast.error("An officer has recorded a rejection reason for this complaint.");
      } else {
        toast.success(`Complaint ${complaint.reference} registered.`);
      }
      setDepartmentId("");
      setDescription("");
      setArea(reportingLocation?.label ?? "");
      setLandmark("");
      setFile(null);
      setCheck(null);
    },
    onError: (error) => toast.error(apiErrorMessage(error, "The complaint could not be filed.")),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" data-testid="report-issue-loading">
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
      </div>
    );
  }
  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  const runCheck = async (captured: File, deptId: string) => {
    const selected = departments?.find((d) => d.id === deptId);
    if (!selected || !departments) {
      setCheck(null);
      return;
    }
    setChecking(true);
    setCheck(null);
    const outcome = await checkCategory(captured, selected, departments);
    setCheck(outcome);
    setChecking(false);
  };

  const onCapture = (captured: File | null) => {
    setCheck(null);
    if (!captured) {
      setFile(null);
      return;
    }
    if (captured.size > MAX_BYTES) {
      toast.error("That capture is over 30 MB. Record a shorter video.");
      return;
    }
    setFile(captured);
    if (departmentId) void runCheck(captured, departmentId);
  };

  const canSubmit =
    !!departmentId && description.trim().length >= 15 && !!area.trim() && !!file &&
    !checking && !!check && check.match !== false && !submit.isPending;

  return (
    <AppShell
      user={user}
      title="Report an Issue"
      subtitle="Pick a category and capture a live photo or video of the problem."
    >
      <form
        className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12"
        data-testid="report-issue-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) {
            toast.error(
              check?.match === false
                ? "The capture does not match the category. Retake it."
                : "Choose a category, describe the issue, name the area and capture a photo or video.",
            );
            return;
          }
          submit.mutate();
        }}
      >
        <div className="space-y-6 lg:col-span-7">
          {/* 1. Category — exactly seven, single-select */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-bold">
              <span className="font-mono text-primary">01</span> Choose the category
            </h2>
            <p className="pt-1 pb-4 text-sm text-muted-foreground">
              One category per complaint — it decides which of the seven departments receives it.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-testid="category-grid">
              {(departments ?? []).map((department) => {
                const Icon = departmentIcon(department.id);
                const active = departmentId === department.id;
                return (
                  <button
                    key={department.id}
                    type="button"
                    onClick={() => {
                      setDepartmentId(department.id);
                      if (file) void runCheck(file, department.id);
                    }}
                    aria-pressed={active}
                    data-testid={`category-option-${department.id}`}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 text-left transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5",
                      active
                        ? "border-primary bg-secondary/70 ring-1 ring-primary/40"
                        : "border-border bg-card hover:border-primary/50",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl text-white",
                        active ? "gradient-crimson" : "gradient-tile",
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{department.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{department.tamil_name}</p>
                      <p className="pt-1 text-xs leading-snug text-muted-foreground">
                        {department.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Details — typed only; there is no dictation here */}
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div>
              <h2 className="text-base font-bold">
                <span className="font-mono text-primary">02</span> Describe the issue
              </h2>
              <p className="pt-1 text-sm text-muted-foreground">
                Type the details in your own words — at least 15 characters.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="A deep pothole has opened across the lane near the bus stop and two-wheelers are swerving into oncoming traffic."
                data-testid="description-input"
              />
              <p className="text-right text-xs text-muted-foreground" data-testid="description-counter">
                {description.trim().length}/15 minimum
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="area">Area or ward</Label>
                <Input
                  id="area"
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                  placeholder="Palayamkottai"
                  data-testid="area-input"
                />
                <p className="text-xs text-muted-foreground" data-testid="reporting-location-status">
                  {locationMessage}
                  {reportingLocation ? (
                    <>
                      {" · "}
                      <a
                        className="underline"
                        href="https://www.openstreetmap.org/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        © OpenStreetMap contributors
                      </a>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="landmark">Nearest landmark (optional)</Label>
                <Input
                  id="landmark"
                  value={landmark}
                  onChange={(event) => setLandmark(event.target.value)}
                  placeholder="Opposite the HPO bus stand"
                  data-testid="landmark-input"
                />
              </div>
            </div>
          </section>

          {/* 3. Evidence — live camera capture only */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-bold">
              <span className="font-mono text-primary">03</span> Capture evidence
            </h2>
            <p className="pt-1 pb-4 text-sm text-muted-foreground">
              Take a photo or record a video (up to 30 seconds) with your camera.
            </p>

            <CameraCapture capture={file} onCapture={onCapture} />

            {file ? (
              <div
                className={cn(
                  "mt-3 flex items-start gap-2 rounded-xl p-3 text-sm ring-1",
                  checking || !check
                    ? "bg-secondary/60 ring-border"
                    : check.match === false
                      ? "bg-red-50 text-red-900 ring-red-200"
                      : check.match === true
                        ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
                        : "bg-amber-50 text-amber-900 ring-amber-200",
                )}
                data-testid="category-check-result"
              >
                {checking ? (
                  <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden />
                ) : check?.match === false ? (
                  <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                )}
                <span>
                  {checking
                    ? "AI is checking that the capture shows the selected category…"
                    : !departmentId
                      ? "Choose a category above to run the AI check."
                      : check?.message}
                </span>
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={!canSubmit}
              className="gradient-crimson mt-4 w-full font-semibold text-white shadow-md transition-transform active:scale-[0.98] disabled:opacity-55"
              size="lg"
              data-testid="submit-complaint-button"
            >
              {submit.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {submit.isPending ? "Submitting…" : "Submit complaint"}
            </Button>
          </section>
        </div>

        {/* Side rail */}
        <aside className="space-y-5 lg:col-span-5">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <ShieldCheck className="size-4 text-primary" aria-hidden />
              What the officer can review
            </h2>
            <ul className="space-y-2.5 pt-3 text-sm">
              {[
                "You must capture a live photo or video — gallery uploads are not accepted.",
                "A free AI checks that the capture visually shows the selected category.",
                "If it doesn't match, retake the photo or video before submitting.",
                "The department officer sees your capture and the AI result.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                  <span className="text-muted-foreground">{line}</span>
                </li>
              ))}
            </ul>
          </section>

        </aside>
      </form>

      {/* Outcome */}
      {result ? (
        <section
          className={cn(
            "mt-6 rounded-2xl border p-5 shadow-sm",
            result.status === "rejected"
              ? "border-red-300 bg-red-50"
              : "border-emerald-200 bg-emerald-50",
          )}
          data-testid="submission-result"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {result.status === "rejected" ? (
                <XCircle className="size-5 text-red-600" aria-hidden />
              ) : (
                <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
              )}
              <div>
                <p className="text-base font-bold" data-testid="submission-result-title">
                  {result.status === "rejected"
                    ? "Complaint rejected by an officer"
                    : `Complaint ${result.reference} registered`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {result.department_name} · {result.area}
                </p>
              </div>
            </div>
            <a
              href="/citizen/reports"
              className={buttonVariants({ variant: "outline", size: "sm" })}
              data-testid="go-to-reports-link"
            >
              Open report status
            </a>
          </div>

          {result.rejection_reason ? (
            <p
              className="mt-3 rounded-xl border border-red-200 bg-white p-3 text-sm leading-relaxed text-red-900"
              data-testid="submission-rejection-reason"
            >
              <span className="font-bold">Reason: </span>
              {result.rejection_reason}
            </p>
          ) : (
            <p className="mt-3 text-sm text-emerald-900" data-testid="submission-verification-note">
              {result.verification_note}
            </p>
          )}

          {result.evidence ? (
            <div className="mt-4">
              <EvidenceAudit evidence={result.evidence} testIdPrefix="submission" />
            </div>
          ) : null}
        </section>
      ) : null}
    </AppShell>
  );
}
