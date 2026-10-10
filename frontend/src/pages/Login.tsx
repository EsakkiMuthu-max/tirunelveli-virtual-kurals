import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { IdCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { departmentIcon } from "@/components/AppShell";
import { useSession } from "@/hooks/useSession";
import { apiErrorMessage, apiGet, apiPost } from "@/lib/api";
import { beginSession } from "@/lib/session";
import type { Department, SessionUser } from "@/lib/types";

export default function Login() {
  const navigate = useNavigate();
  const { user } = useSession();

  const [citizenId, setCitizenId] = useState("");
  const [citizenPassword, setCitizenPassword] = useState("");
  const [officerId, setOfficerId] = useState("");
  const [officerPassword, setOfficerPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  // The static shell must render with no backend, so this list degrades to empty.
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiGet<Department[]>("/departments"),
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (user) navigate(user.role === "officer" ? "/officer" : "/citizen", { replace: true });
  }, [user, navigate]);

  const afterLogin = async (session: SessionUser) => {
    await beginSession(session);
    toast.success(`Welcome, ${session.display_name}`);
    navigate(session.role === "officer" ? "/officer" : "/citizen", { replace: true });
  };

  const citizenLogin = useMutation({
    mutationFn: () =>
      apiPost<SessionUser>("/auth/citizen/login", {
        citizen_id: citizenId.trim(),
        password: citizenPassword,
      }),
    onSuccess: afterLogin,
    onError: (error) => toast.error(apiErrorMessage(error, "Could not sign in.")),
  });

  const officerLogin = useMutation({
    mutationFn: () =>
      apiPost<SessionUser>("/auth/officer/login", {
        officer_id: officerId.trim(),
        password: officerPassword,
        department_id: departmentId,
      }),
    onSuccess: afterLogin,
    onError: (error) => toast.error(apiErrorMessage(error, "Could not sign in.")),
  });

  const officerList = departments ?? [];
  const selectedDepartment = officerList.find((d) => d.id === departmentId);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-sidebar px-10 py-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute -top-24 -right-20 size-80 rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #FBBF24 0%, transparent 65%)" }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white/15 text-3xl font-bold ring-1 ring-white/25">
              க
            </div>
            <div className="leading-tight">
              <p className="font-heading text-xl font-bold">Tirunelveli Virtual Kural</p>
              <p className="text-sm text-white/70">திருநெல்வேலி மெய்நிகர் குறள்</p>
            </div>
          </div>

          <h2 className="max-w-md pt-14 text-4xl leading-[1.1] font-bold">
            One ward, one report,
            <span className="block text-amber-300">one accountable officer.</span>
          </h2>
          <p className="max-w-md pt-4 text-[15px] leading-relaxed text-white/80">
            File a civic grievance with a photo or video. Optional local AI estimates help officers
            review category relevance and possible AI-generated media; only the assigned officer can
            reject a complaint, with a reason recorded for the citizen.
          </p>
        </div>

        <div className="relative space-y-3">
          <p className="text-[11px] font-bold tracking-widest text-amber-300 uppercase">
            Seven departments, seven officers
          </p>
          <div className="flex flex-wrap gap-2">
            {officerList.map((department) => {
              const Icon = departmentIcon(department.id);
              return (
                <span
                  key={department.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs font-medium ring-1 ring-white/20"
                >
                  <Icon className="size-3.5" aria-hidden />
                  {department.name}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* Auth panel */}
      <section className="flex items-center justify-center px-5 py-10 md:px-10">
        <div className="w-full max-w-md">
          <div className="pb-6 lg:hidden">
            <p className="font-heading text-2xl font-bold text-primary">Tirunelveli Virtual Kural</p>
            <p className="text-sm text-muted-foreground">திருநெல்வேலி மெய்நிகர் குறள்</p>
          </div>

          <h1 className="text-3xl font-bold text-primary">Sign in</h1>
          <p className="pt-1 pb-6 text-sm text-muted-foreground">
            Accounts are issued by the Corporation. There is no public sign-up.
          </p>

          <Tabs defaultValue="citizen" className="w-full">
            <TabsList className="w-full" data-testid="login-role-tabs">
              <TabsTrigger value="citizen" className="flex-1" data-testid="citizen-tab">
                Citizen
              </TabsTrigger>
              <TabsTrigger value="officer" className="flex-1" data-testid="officer-tab">
                Department Officer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="citizen" className="pt-5">
              <form
                className="space-y-4"
                data-testid="citizen-login-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  citizenLogin.mutate();
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="citizen-id">Citizen ID</Label>
                  <div className="relative">
                    <IdCard className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input
                      id="citizen-id"
                      value={citizenId}
                      onChange={(event) => setCitizenId(event.target.value)}
                      placeholder="TVK0001"
                      autoComplete="username"
                      className="pl-9 font-mono tracking-wide uppercase"
                      data-testid="citizen-id-input"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Any ID from TVK0001 to TVK9999 is pre-registered.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="citizen-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input
                      id="citizen-password"
                      type="password"
                      value={citizenPassword}
                      onChange={(event) => setCitizenPassword(event.target.value)}
                      placeholder="citizen@123"
                      autoComplete="current-password"
                      className="pl-9"
                      data-testid="citizen-password-input"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={citizenLogin.isPending}
                  className="gradient-crimson w-full font-semibold text-white shadow-md transition-transform active:scale-[0.98]"
                  data-testid="citizen-login-submit"
                >
                  {citizenLogin.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Sign in as citizen
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setCitizenId("TVK0001");
                    setCitizenPassword("citizen@123");
                  }}
                  className="w-full rounded-xl border border-dashed border-primary/35 bg-secondary/60 p-3 text-left text-xs transition-colors hover:border-primary/60"
                  data-testid="citizen-demo-fill"
                >
                  <span className="font-bold text-primary">Fill a demo citizen login</span>
                  <span className="block pt-0.5 font-mono text-muted-foreground">
                    TVK0001 · citizen@123
                  </span>
                </button>
              </form>
            </TabsContent>

            <TabsContent value="officer" className="pt-5">
              <form
                className="space-y-4"
                data-testid="officer-login-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!departmentId) {
                    toast.error("Select your department.");
                    return;
                  }
                  officerLogin.mutate();
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="officer-department">Department</Label>
                  <Select value={departmentId} onValueChange={(value: string) => setDepartmentId(value)}>
                    <SelectTrigger id="officer-department" data-testid="officer-department-select">
                      <SelectValue placeholder="Choose one of the seven departments">
                        {() => selectedDepartment?.name ?? "Choose one of the seven departments"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {officerList.map((department) => (
                        <SelectItem
                          key={department.id}
                          value={department.id}
                          data-testid={`officer-department-option-${department.id}`}
                        >
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="officer-id">Officer ID</Label>
                  <div className="relative">
                    <ShieldCheck className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input
                      id="officer-id"
                      value={officerId}
                      onChange={(event) => setOfficerId(event.target.value)}
                      placeholder="officer1"
                      autoComplete="username"
                      className="pl-9 font-mono"
                      data-testid="officer-id-input"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="officer-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input
                      id="officer-password"
                      type="password"
                      value={officerPassword}
                      onChange={(event) => setOfficerPassword(event.target.value)}
                      placeholder="officer@123"
                      autoComplete="current-password"
                      className="pl-9"
                      data-testid="officer-password-input"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={officerLogin.isPending}
                  className="gradient-crimson w-full font-semibold text-white shadow-md transition-transform active:scale-[0.98]"
                  data-testid="officer-login-submit"
                >
                  {officerLogin.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Sign in as officer
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setDepartmentId(officerList[0]?.id ?? "roads_potholes");
                    setOfficerId("officer1");
                    setOfficerPassword("officer@123");
                  }}
                  className="w-full rounded-xl border border-dashed border-primary/35 bg-secondary/60 p-3 text-left text-xs transition-colors hover:border-primary/60"
                  data-testid="officer-demo-fill"
                >
                  <span className="font-bold text-primary">Fill a demo officer login</span>
                  <span className="block pt-0.5 font-mono text-muted-foreground">
                    officer1 · officer@123 · Roads &amp; Potholes
                  </span>
                </button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="pt-6 text-xs leading-relaxed text-muted-foreground">
            officer1 … officer7 map one-to-one onto the seven departments. An officer can only sign
            in against their own department.
          </p>
        </div>
      </section>
    </div>
  );
}
