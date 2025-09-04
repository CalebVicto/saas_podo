import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Calendar,
  Clock,
  User,
  Users,
  FileText,
  Save,
  ArrowLeft,
  Search,
  Check,
  CheckCircle,
  Package as PackageIcon,
  ShoppingBag,
  Plus,
  Minus,
  X,
  Stethoscope,
  Pill,
  PackageOpen,
  DollarSign,
  FileEdit,
  Wallet,
  Trash,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  CreateAppointmentRequest,
  Patient,
  Worker,
  Product,
  ProductCategory,
  PatientPackage,
  PackageSession,
  Abono,
  ApiResponse,
  Package,
} from "@shared/api";
import { apiGet } from "@/lib/auth";
import { AppointmentRepository } from "@/lib/api/appointment";
import { PatientRepository } from "@/lib/api/patient";
import { WorkerRepository } from "@/lib/api/worker";
import Layout from "@/components/Layout";
import { Pagination } from "@/components/ui/pagination";
// Predefined diagnosis options
const PREDEFINED_DIAGNOSES = [
  "Onicomicosis",
  "Uñas encarnadas",
  "Fascitis plantar",
  "Callosidades plantares",
  "Helomas (callos duros)",
  "Hiperqueratosis",
  "Pie diabético",
  "Verrugas plantares",
  "Grietas en talones",
  "Metatarsalgia",
  "Espolón calcáneo",
  "Neuroma de Morton",
  "Dedos en garra",
  "Hallux valgus (juanetes)",
  "Pie plano",
  "Pie cavo",
];

// Predefined treatment options
const PREDEFINED_TREATMENTS = [
  "Cuidado general de uñas",
  "Tratamiento de onicomicosis",
  "Curación de uñas encarnadas",
  "Eliminación de callosidades",
  "Desbridamiento de hiperqueratosis",
  "Aplicación de medicamentos tópicos",
  "Confección de plantillas ortopédicas",
  "Vendajes y curaciones",
  "Masaje terapéutico",
  "Ejercicios de fisioterapia",
  "Educación sobre cuidado del pie",
  "Recomendaciones de calzado",
  "Seguimiento y control",
  "Tratamiento con láser",
  "Crioterapia",
];
interface SearchableSelectProps {
  items: (Patient | Worker)[];
  value: string;
  onValueChange: (value: string, item: Patient | Worker) => void;
  placeholder: string;
  displayField: (item: Patient | Worker) => string;
  searchFields: (item: Patient | Worker) => string[];
  emptyText: string;
  selectedItem?: Patient | Worker | null;
  fetchItems?: (search: string) => Promise<(Patient | Worker)[]>;
}

function SearchableSelect({
  items,
  value,
  onValueChange,
  placeholder,
  displayField,
  searchFields,
  emptyText,
  selectedItem,
  fetchItems,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [remoteItems, setRemoteItems] = useState<(Patient | Worker)[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const latestSearchRef = useRef(0);
  const searchDebounceRef = useRef<number | null>(null);
  const [itemSelected, setItemSelected] = useState<Patient | Worker | null>(null);

  const doRemoteSearch = useCallback(
    async (term: string) => {
      if (!fetchItems) return;
      const start = ++latestSearchRef.current;
      setIsSearching(true);
      try {
        const items = await fetchItems(term);
        // ignore out-of-order responses
        if (start === latestSearchRef.current) {
          setRemoteItems(items);
        }
      } catch (err) {
        console.error("SearchableSelect remote search error:", err);
        if (start === latestSearchRef.current) setRemoteItems([]);
      } finally {
        if (start === latestSearchRef.current) setIsSearching(false);
      }
    },
    [fetchItems],
  );

  useEffect(() => {
    if (!fetchItems) return;
    // clear previous debounce
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }

    // if no search term, clear remote items
    if (!searchTerm) {
      latestSearchRef.current += 1;
      setRemoteItems([]);
      setIsSearching(false);
      return;
    }

    // debounce remote calls by 300ms
    searchDebounceRef.current = window.setTimeout(() => {
      doRemoteSearch(searchTerm.trim());
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
    };
  }, [searchTerm, fetchItems, doRemoteSearch]);

  const filteredItems = useMemo(() => {
    // If a remote fetch function is provided and there is a search term,
    // prefer remote results (so users can find patients not in the local list).
    if (fetchItems && searchTerm) return remoteItems;
    if (!searchTerm) return items;

    return items.filter((item) =>
      searchFields(item).some((field) =>
        field.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
  }, [items, remoteItems, searchTerm, searchFields, fetchItems]);

  // Keep internal selected item in sync with external `value` and available items
  useEffect(() => {
    if (!value) {
      setItemSelected(null);
      return;
    }
    const all = [...items, ...remoteItems];
    const found = all.find((it) => it && (it as any).id === value) || null;
    if (found) {
      setItemSelected(found as Patient | Worker | null);
    } else if (selectedItem && (selectedItem as any).id === value) {
      // fallback to external selected item passed by parent
      setItemSelected(selectedItem as Patient | Worker | null);
    } else {
      setItemSelected(null);
    }
  }, [value, items, remoteItems]);

  const handleSelect = (item: Patient | Worker) => {
    setItemSelected(item);
    console.log("Selected item:", item);
    onValueChange(item.id, item);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full justify-start font-normal"
      >
        {itemSelected || selectedItem ? (
          <span className="truncate">{displayField(itemSelected ?? (selectedItem as Patient | Worker))}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{placeholder}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {fetchItems && searchTerm && isSearching && (
                <div className="py-6 text-center text-muted-foreground">Buscando...</div>
              )}

              {!isSearching && filteredItems.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {emptyText}
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                      value === item.id && "border-primary bg-primary/5",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{displayField(item)}</p>
                        {"email" in item && (
                          <p className="text-sm text-muted-foreground">
                            {item.email}
                          </p>
                        )}
                        {"documentType" in item && (
                          <p className="text-sm text-muted-foreground">
                            {item.documentType.toUpperCase()}: {item.documentNumber}
                          </p>
                        )}
                        {"specialization" in item && item.specialization && (
                          <p className="text-sm text-muted-foreground">
                            {item.specialization}
                          </p>
                        )}
                      </div>
                      {value === item.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setSearchTerm("");
              }}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface SearchableTextInputProps {
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  label: string;
}

function SearchableTextInput({
  options,
  value,
  onValueChange,
  placeholder,
  label,
}: SearchableTextInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState(value);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [options, searchTerm]);

  const handleOptionSelect = (option: string) => {
    setInputValue(option);
    onValueChange(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onValueChange(newValue);
  };

  return (
    <>
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setIsOpen(true)}
        >
          <Search className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Seleccionar {label}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder={`Buscar ${label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-64 space-y-1 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>No se encontraron opciones</p>
                  <p className="text-sm">
                    Puedes escribir un valor personalizado
                  </p>
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <div
                    key={index}
                    onClick={() => handleOptionSelect(option)}
                    className="cursor-pointer rounded-lg border border-border p-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {value === option && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="text-center text-xs text-muted-foreground">
              También puedes escribir un valor personalizado directamente en el
              campo
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CreateAppointment() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const appointmentRepository = useMemo(() => new AppointmentRepository(), []);
  const patientRepository = useMemo(() => new PatientRepository(), []);
  const workerRepository = useMemo(() => new WorkerRepository(), []);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [patientPackages, setPatientPackages] = useState<PatientPackage[]>([]);
  const [packages, setPackages] = useState<Package[]>([]); // Estado para los paquetes
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<CreateAppointmentRequest>({
    patientId: "",
    workerId: "",
    dateTime: getPeruDateTimeLocalNow(),
    treatmentNotes: "",
    diagnosis: "",
    observation: "",
    treatmentPrice: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function getPeruDateTimeLocalNow(): string {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000; // minutos a milisegundos
    const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  }

  // Selected patient state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Products state
  const [selectedProducts, setSelectedProducts] = useState<
    Array<{ product: Product; quantity: number }>
  >([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Package state
  const [selectedPackages, setSelectedPackages] = useState<Package[]>([]);
  // Monto que se aplicará por sesión para cada paquete seleccionado (packageId -> monto)
  const [packageSessionAmounts, setPackageSessionAmounts] = useState<Record<string, number>>({});

  // Abonos state
  const [selectedAbonos, setSelectedAbonos] = useState<
    Array<{ abono: Abono; amountToUse: number }>
  >([]);
  const [availableAbonos, setAvailableAbonos] = useState<Abono[]>([]);

  // Estado para paginación de productos y paquetes
  const [productPage, setProductPage] = useState(1);
  const [packagePage, setPackagePage] = useState(1);
  const PRODUCTS_PER_PAGE = 8;
  const PACKAGES_PER_PAGE = 8;

  // Estado para paginación real
  const [productApiPage, setProductApiPage] = useState(1);
  const [packageApiPage, setPackageApiPage] = useState(1);
  const PRODUCTS_API_LIMIT = 10;
  const PACKAGES_API_LIMIT = 10;
  const [productsApiTotal, setProductsApiTotal] = useState(0);
  const [packagesApiTotal, setPackagesApiTotal] = useState(0);

  // UI: which package view to show when patient has packages
  const [packageView, setPackageView] = useState<'inuse' | 'more'>('more');

  useEffect(() => {
    loadData();
    loadPackages();
  }, []);

  // If patientId is provided in the query string (from PatientDetail), preload the patient
  const location = useLocation();
  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const patientIdFromQuery = qs.get("patientId");
    if (!patientIdFromQuery) return;

    const preloadPatient = async () => {
      try {
        const patient = await patientRepository.getById(patientIdFromQuery);
        if (patient) {
          setSelectedPatient(patient);
          setFormData((prev) => ({ ...prev, patientId: patient.id }));
          setPatients((prev) => (prev.some((p) => p.id === patient.id) ? prev : [...prev, patient]));
        }
      } catch (err) {
        console.error("Error precargando paciente desde querystring:", err);
      }
    };

    preloadPatient();
    // only run when the query string changes
  }, [location.search, patientRepository]);
  // Cargar paquetes usando apiGet igual que Packages.tsx
  const loadPackages = async () => {
    try {
      const resp = await apiGet<ApiResponse<{ data: Package[]; total: number; page: number; limit: number }>>("/package?page=1&limit=10&search=");
      if (resp.error) {
        setPackages([]);
        return;
      }
      // Normalizar el payload del API y asignar siempre un array
      const apiPayload = resp as any;
      const extracted = Array.isArray(apiPayload?.data)
        ? apiPayload.data
        : Array.isArray(apiPayload?.data?.data)
          ? apiPayload.data.data
          : Array.isArray(apiPayload?.data?.data?.data)
            ? apiPayload.data.data.data
            : [];
      setPackages(extracted || []);
    } catch (error) {
      console.error("Error cargando paquetes:", error);
      setPackages([]);
    }
  };

  useEffect(() => {
    if (isEditMode && id) {
      const fetchAppointment = async () => {
        setIsLoading(true);
        try {
          const appt = await appointmentRepository.getById(id);
          // Normalize patientId / workerId because backend may return nested objects
          const patientIdStr = appt.patientId
            ? typeof appt.patientId === "string"
              ? appt.patientId
              : (appt.patientId as any).id || ""
            : "";
          const workerIdStr = (appt as any).userId
            ? typeof (appt as any).userId === "string"
              ? (appt as any).userId
              : (appt as any).userId.id || (appt as any).userId?.userId || ""
            : appt.workerId || "";

          setFormData({
            patientId: patientIdStr,
            workerId: workerIdStr,
            dateTime: appt.date
              ? appt.date.slice(0, 16)
              : getPeruDateTimeLocalNow(),
            treatmentNotes: appt.treatment || "",
            diagnosis: appt.diagnosis || "",
            observation: appt.observation || "",
            treatmentPrice: appt.treatmentPrice,
          });

          // If the API returned the full patient object, set it so the SearchableSelect shows
          if (appt.patientId && typeof appt.patientId === "object") {
            try {
              setSelectedPatient(appt.patientId as Patient);
            } catch (e) {
              // ignore if shape differs
            }
          }
          // Ensure patients list contains the loaded patient so SearchableSelect can render it
          if (appt.patientId && typeof appt.patientId === "object") {
            const incomingPatient = appt.patientId as Patient;
            setPatients((prev) => {
              if (prev.some((p) => p.id === (incomingPatient as any).id)) return prev;
              return [...prev, incomingPatient];
            });
          }

          // If API returned a user/worker object (e.g. userId), ensure workers list contains it
          const workerObj = (appt as any).userId || (appt as any).user;
          if (workerObj && typeof workerObj === "object") {
            const incomingWorker = {
              id: workerObj.id || workerObj._id || "",
              firstName: workerObj.firstName || workerObj.name || "",
              lastName: workerObj.lastName || workerObj.surname || "",
              email: workerObj.email || "",
              specialization: workerObj.specialization || "",
            } as Worker;
            setWorkers((prev) => {
              if (prev.some((w) => w.id === incomingWorker.id)) return prev;
              return [...prev, incomingWorker];
            });
          }
          if (appt.products) {
            setSelectedProducts(
              appt.products.map((p: any) => ({
                product: {
                  id: p.id,
                  name: p.name,
                  slug: "",
                  price: p.price,
                  stock: 0,
                  categoryId: "",
                  status: "active",
                  createdAt: "",
                  updatedAt: "",
                } as Product,
                quantity: p.quantity || 1,
              })),
            );
          }
          // Normalize packages from appointment response (support old packageIds: string[] and new packages: [{id, abono}])
          if ((appt as any).packages || (appt as any).packageIds) {
            const pkgsRaw: any[] = Array.isArray((appt as any).packages)
              ? (appt as any).packages
              : Array.isArray((appt as any).packageIds)
                ? (appt as any).packageIds.map((id: any) => ({ id }))
                : [];
            const normalizedPkgs: Package[] = pkgsRaw.map((p) => {
              // p may be { id } or { id, abono } or nested object
              const id = p.id || (typeof p === "string" ? p : undefined) || (p.packageId && (p.packageId.id || p.packageId));
              const name = p.name || (p.package && p.package.name) || undefined;
              const price = Number(p.price ?? p.packagePrice ?? (p.package && p.package.price) ?? 0) || undefined;
              return { id, name, price } as Package;
            }).filter((pp) => pp.id);
            if (normalizedPkgs.length > 0) {
              setSelectedPackages(normalizedPkgs);
              // If API returned amounts/abonos, populate packageSessionAmounts
              const amounts: Record<string, number> = {};
              pkgsRaw.forEach((raw) => {
                const pid = raw.id || (typeof raw === 'string' ? raw : (raw.packageId && (raw.packageId.id || raw.packageId)));
                const abonoVal = raw.abono ?? raw.amount ?? raw.paymentAmount ?? raw.monto ?? undefined;
                if (pid) {
                  amounts[pid] = typeof abonoVal !== 'undefined' ? Number(abonoVal) : (packageSessionAmounts[pid] ?? 0);
                }
              });
              setPackageSessionAmounts((prev) => ({ ...prev, ...amounts }));
            }
          }
          // If the appointment contains patientPackageDetails (used patient packages), map them
          // into local `patientPackages` state and pre-select the corresponding package entries
          // so the UI shows which patient packages were used in this appointment.
          if ((appt as any).patientPackageDetails && Array.isArray((appt as any).patientPackageDetails)) {
            try {
              const ppDetails: any[] = (appt as any).patientPackageDetails;
              // Map to PatientPackage shape used in the page (best-effort)
              const mappedPatientPackages: PatientPackage[] = ppDetails.map((d) => {
                // the API may nest the patientPackage under patientPackageId or patientPackage
                const rawPP = d.patientPackageId || d.patientPackage || d.patientPackage || {};
                const pkg = rawPP.packageId || rawPP.package || {};
                return {
                  id: rawPP.id || rawPP._id || rawPP.patientPackageId || String(rawPP),
                  patientId: (rawPP.patientId && (rawPP.patientId.id || rawPP.patientId)) || formData.patientId || rawPP.patientId || "",
                  packageId: pkg.id || pkg._id || pkg || rawPP.packageId || undefined,
                  remainingSessions: Number(rawPP.remainingSessions ?? rawPP.sessions ?? 0),
                  packagePrice: Number(rawPP.packagePrice ?? pkg.price ?? 0),
                  debt: typeof rawPP.debt !== 'undefined' ? Number(rawPP.debt) : undefined,
                  createdAt: rawPP.createdAt || rawPP.created_at || undefined,
                  updatedAt: rawPP.updatedAt || rawPP.updated_at || undefined,
                  // keep original raw object in case some UI needs nested access
                  // @ts-ignore
                  raw: rawPP,
                } as unknown as PatientPackage;
              });

              // Merge into existing patientPackages, avoiding duplicates
              setPatientPackages((prev) => {
                const byId = new Map<string, PatientPackage>();
                prev.forEach((p) => byId.set((p as any).id, p));
                mappedPatientPackages.forEach((p) => byId.set((p as any).id, p));
                return Array.from(byId.values());
              });

              // Pre-select packages used in appointment: use nested packageId from each patientPackageDetail
              const preSelected: Package[] = [];
              const amountsFromDetails: Record<string, number> = {};
              ppDetails.forEach((d) => {
                const rawPP = d.patientPackageId || d.patientPackage || {};
                const pkg = rawPP.packageId || rawPP.package || d.packageId || d.package || {};
                const pkgId = pkg.id || pkg._id || pkg;
                if (pkgId) {
                  preSelected.push({ id: pkgId, name: pkg.name || pkg.title || undefined, price: Number(rawPP.packagePrice ?? pkg.price ?? d.payment ?? d.abono ?? 0) } as Package);
                  // prefer coverage/payment fields from the appointment detail
                  const payment = d.coverage ?? d.payment ?? d.abono ?? d.amount ?? rawPP.packagePrice ?? pkg.price ?? 0;
                  amountsFromDetails[pkgId] = Number(payment);
                }
              });

              if (preSelected.length > 0) {
                // avoid duplicates when merging with other selectedPackages
                setSelectedPackages((prev) => {
                  const map = new Map<string, Package>();
                  prev.forEach((p) => map.set(p.id, p));
                  preSelected.forEach((p) => map.set(p.id, p));
                  return Array.from(map.values());
                });
                setPackageSessionAmounts((prev) => ({ ...prev, ...amountsFromDetails }));
              }
            } catch (err) {
              console.error('Error processing patientPackageDetails:', err);
            }
          }
        } catch (error) {
          console.error("Error loading appointment:", error);
          toast({
            title: "Error al cargar la cita.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchAppointment();
    }
  }, [id, isEditMode, appointmentRepository]);

  useEffect(() => {
    const loadPatientData = async () => {
      if (!formData.patientId) {
        setAvailableAbonos([]);
        setSelectedAbonos([]);
        setPatientPackages([]);
        return;
      }
      try {
        const detail = await patientRepository.getDetailStatistics(
          formData.patientId,
        );
        const activeAbonos = (detail.abonos || []).filter(
          (a) => a.isActive && a.remainingAmount > 0,
        );
        setAvailableAbonos(activeAbonos);
        setPatientPackages(detail.patientPackages || []);
      } catch (error) {
        console.error("Error loading patient data:", error);
        setAvailableAbonos([]);
        setPatientPackages([]);
      }
    };
    loadPatientData();
  }, [formData.patientId, patientRepository]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [patientsResp, workersResp, productsResp, categoriesResp] =
        await Promise.all([
          patientRepository.getAll({ limit: 1000 }),
          workerRepository.getAll({ limit: 1000 }),
          apiGet<
            ApiResponse<{
              data: Product[];
              total: number;
              page: number;
              limit: number;
            }>
          >("/product?page=1&limit=1000"),
          apiGet<
            ApiResponse<{
              data: ProductCategory[];
              total: number;
              page: number;
              limit: number;
            }>
          >("/product-category?page=1&limit=1000"),
        ]);
      setPatients(patientsResp.items);
      setWorkers(workersResp.items);
      setProducts(productsResp.data?.data.data || []);
      setCategories(categoriesResp.data?.data.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ...existing code...

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId) {
      newErrors.patientId = "Selecciona un paciente";
    }
    if (!formData.workerId) {
      newErrors.workerId = "Selecciona un trabajador";
    }
    if (!formData.dateTime) {
      newErrors.dateTime = "Selecciona fecha y hora";
    } else {
      const appointmentDate = new Date(formData.dateTime);
      const now = new Date();
      // if (appointmentDate < now) {
      //   newErrors.dateTime = "La fecha no puede ser en el pasado";
      // }
    }
    if (!formData.treatmentNotes?.trim()) {
      newErrors.treatmentNotes = "Describe el tratamiento";
    }
    if (!formData.diagnosis?.trim()) {
      newErrors.diagnosis = "Ingresa el diagnóstico";
    }

    setErrors(newErrors);
    // Si hay errores en campos de la pestaña "general", cambiar a esa pestaña
    const generalFields = [
      'patientId',
      'workerId',
      'dateTime',
      'diagnosis',
      'treatmentNotes',
    ];
    const errorKeys = Object.keys(newErrors);
  
    // También mostrar los errores como snackbars/toasts para mayor visibilidad
    const errorMsgs = Object.values(newErrors);
    if (errorMsgs.length > 0) {
      // solo muestra el primero
      toast({ title: errorMsgs[0], variant: "destructive" });
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const productsPayload = selectedProducts.map((sp) => ({
        productId: sp.product.id,
        quantity: sp.quantity,
      }));
      const appointmentPrice =
        (formData.treatmentPrice || 0) +
        selectedProducts.reduce(
          (sum, sp) => sum + sp.product.price * sp.quantity,
          0,
        );
      const payload: any = {
        userId: formData.workerId,
        diagnosis: formData.diagnosis,
        treatment: formData.treatmentNotes,
        treatmentPrice: formData.treatmentPrice || 0,
        patientId: formData.patientId,
        products: productsPayload,
        // Enviar paquetes como arreglo de objetos: [{ id: string, payment: number }]
        packages: selectedPackages.map((p) => ({ id: p.id, payment: Number(packageSessionAmounts[p.id] ?? 0) })),
        appointmentPrice,
        date: formData.dateTime,
      };
      if (isEditMode && id) {
        await appointmentRepository.update(id, payload);
      } else {
        await appointmentRepository.create(payload);
      }
      navigate("/appointments");
    } catch (error) {
      console.error(
        isEditMode
          ? "Error updating appointment:"
          : "Error creating appointment:",
        error,
      );
      let message = '';
      if (error instanceof Error) {
        message = error.message;
      } else {
        message = isEditMode
          ? "Error al actualizar la cita"
          : "Error al crear la cita";
      }

      toast({
        title: message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // At least 30 minutes from now
    return now.toISOString().slice(0, 16);
  };

  // Product functions
  const addProduct = (product: Product) => {
    const existingProduct = selectedProducts.find(
      (sp) => sp.product.id === product.id,
    );
    if (existingProduct) {
      setSelectedProducts(
        selectedProducts.map((sp) =>
          sp.product.id === product.id
            ? { ...sp, quantity: sp.quantity + 1 }
            : sp,
        ),
      );
    } else {
      setSelectedProducts([...selectedProducts, { product, quantity: 1 }]);
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(
      selectedProducts.filter((sp) => sp.product.id !== productId),
    );
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId);
    } else {
      setSelectedProducts(
        selectedProducts.map((sp) =>
          sp.product.id === productId ? { ...sp, quantity } : sp,
        ),
      );
    }
  };

  // Package functions
  const getAvailablePackages = (): PatientPackage[] => {
    if (!formData.patientId) return [];
    debugger
    return patientPackages.filter(
      (pp) =>
        pp.patientId === formData.patientId &&
        pp.isActive &&
        pp.remainingSessions > 0,
    );
  };

  // Abono functions
  const addAbonoToPayment = (abono: Abono) => {
    const existingAbono = selectedAbonos.find((sa) => sa.abono.id === abono.id);
    if (!existingAbono) {
      setSelectedAbonos([
        ...selectedAbonos,
        { abono, amountToUse: Math.min(abono.remainingAmount, 10) },
      ]);
    }
  };

  const removeAbonoFromPayment = (abonoId: string) => {
    setSelectedAbonos(selectedAbonos.filter((sa) => sa.abono.id !== abonoId));
  };

  const updateAbonoAmount = (abonoId: string, amount: number) => {
    setSelectedAbonos(
      selectedAbonos.map((sa) =>
        sa.abono.id === abonoId
          ? {
            ...sa,
            amountToUse: Math.min(
              Math.max(0, amount),
              sa.abono.remainingAmount,
            ),
          }
          : sa,
      ),
    );
  };

  const getTotalAbonoAmount = () => {
    return selectedAbonos.reduce((sum, sa) => sum + sa.amountToUse, 0);
  };

  const getTotalCost = () => {
    const treatmentCost = formData.treatmentPrice || 0;
    const productsCost = selectedProducts.reduce(
      (sum, sp) => sum + sp.product.price * sp.quantity,
      0,
    );
    const packageCost = selectedPackages.reduce((sum, pkg) => {
      const amt = typeof packageSessionAmounts[pkg.id] !== 'undefined' ? packageSessionAmounts[pkg.id] : (pkg.price || 0);
      return sum + Number(amt || 0);
    }, 0);
    return treatmentCost + productsCost + packageCost;
  };

  const getRemainingBalance = () => {
    const totalCost = getTotalCost();
    const abonoAmount = getTotalAbonoAmount();
    return Math.max(0, totalCost - abonoAmount);
  };

  // Filter products by search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (product.description &&
        product.description
          .toLowerCase()
          .includes(productSearch.toLowerCase()));
    const matchesCategory =
      selectedCategory === "all" ||
      product.category?.id === selectedCategory;
    return matchesSearch && matchesCategory && product.status === "active";
  });

  // Productos paginados
  const paginatedProducts = filteredProducts.slice(
    (productPage - 1) * PRODUCTS_PER_PAGE,
    productPage * PRODUCTS_PER_PAGE
  );
  const totalProductPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  // Ajustar página cuando cambian búsqueda/categoría o si la página actual queda fuera de rango
  useEffect(() => {
    // reset al cambiar filtros para mostrar siempre la primera página
    setProductPage(1);
  }, [productSearch, selectedCategory]);

  useEffect(() => {
    if (productPage > totalProductPages && totalProductPages > 0) {
      setProductPage(totalProductPages);
    }
  }, [totalProductPages]);

  // Paquetes paginados (cuando usamos paginación del backend, `packages` ya contiene la página actual)
  const paginatedPackages = packages; // packages viene de la API por página
  // calcular total de páginas basadas en el total proporcionado por el API
  const totalPackagePages = Math.max(1, Math.ceil((packagesApiTotal || 0) / PACKAGES_API_LIMIT));

  // Si cambió la página del API, sincronizamos el page cliente (opcional) o reseteamos estado relacionado
  useEffect(() => {
    // si la API devolvió menos páginas y la page actual queda fuera, ajustarla
    if (packageApiPage > totalPackagePages && totalPackagePages > 0) {
      setPackageApiPage(totalPackagePages);
    }
  }, [totalPackagePages, packageApiPage]);

  // Paquetes disponibles para el paciente seleccionado (filtrados desde patientPackages)
  // Paquetes del paciente filtrados (si corresponde)
  const patientPackagesForPatient = useMemo(() => {
    return patientPackages.filter((pp) => pp.patientId === formData.patientId && pp.remainingSessions > 0);
  }, [patientPackages, formData.patientId]);

  // Si el paciente tiene paquetes activos, por defecto mostramos 'inuse'
  useEffect(() => {
    if (patientPackagesForPatient.length > 0) setPackageView('inuse');
    else setPackageView('more');
  }, [patientPackagesForPatient]);

  // Build a homogeneous list to render using packages from the API and annotate if patient owns them
  const itemsForPackageView = useMemo(() => {
    return packages.map((p) => {
      const pp = patientPackages.find((x) => {
        const pid = (x.packageId as any)?.id || x.packageId;
        return pid === p.id;
      });
      return { pkg: p, pp } as { pkg: Package; pp?: PatientPackage };
    });
  }, [packages, patientPackages]);

  // Items to display depending on the small package-tabs (inuse / more)
  const visiblePackageItems = useMemo(() => {
    if (packageView === 'inuse') {
      // Build list from patientPackagesForPatient so it's not limited by API pagination
      return patientPackagesForPatient.map((pp) => {
        const pid = (pp.packageId as any)?.id || pp.packageId;
        // If patientPackage includes nested package info, use it; otherwise try to find in current API page
        const pkgFromPP = (pp.packageId && typeof pp.packageId === "object") ? (pp.packageId as any) : packages.find((p) => p.id === pid) || { id: pid, name: (pp as any)?.name || "Paquete", price: Number((pp as any)?.packagePrice ?? 0), sessions: Number((pp as any)?.sessions ?? (pp as any)?.remainingSessions ?? 1) };
        return { pkg: pkgFromPP as Package, pp } as { pkg: Package; pp: PatientPackage };
      }).filter(x => Number((x.pp as any)?.remainingSessions ?? 0) > 0);
    }
    return itemsForPackageView;
  }, [itemsForPackageView, packageView, patientPackagesForPatient, packages]);

  // Cargar productos paginados del API
  useEffect(() => {
    const fetchProducts = async () => {
      const resp = await apiGet<ApiResponse<{ data: Product[]; total: number; page: number; limit: number }>>(`/product?page=${productApiPage}&limit=${PRODUCTS_API_LIMIT}`);
      setProducts(resp.data?.data.data || []);
      setProductsApiTotal(resp.data?.data.total || 0);
    };
    fetchProducts();
  }, [productApiPage]);

  // Cargar paquetes paginados del API
  useEffect(() => {
    const fetchPackages = async () => {
      const resp = await apiGet<ApiResponse<{ data: Package[]; total: number; page: number; limit: number }>>(`/package?page=${packageApiPage}&limit=${PACKAGES_API_LIMIT}`);
      const apiPayload = resp as any;
      const extracted = Array.isArray(apiPayload?.data)
        ? apiPayload.data
        : Array.isArray(apiPayload?.data?.data)
          ? apiPayload.data.data
          : Array.isArray(apiPayload?.data?.data?.data)
            ? apiPayload.data.data.data
            : [];
      setPackages(extracted || []);
      setPackagesApiTotal(apiPayload?.data?.total || apiPayload?.data?.data?.total || 0);
    };
    fetchPackages();
  }, [packageApiPage]);

  if (isLoading) {
    return (
      <Layout
        title={isEditMode ? "Editar Cita" : "Nueva Cita"}
        subtitle={
          isEditMode
            ? "Actualizar información de la cita"
            : "Programar nueva cita médica"
        }
      >
        <div className="p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="loading-shimmer h-16 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={isEditMode ? "Editar Cita" : "Nueva Cita"}
      subtitle={
        isEditMode
          ? "Actualizar información de la cita"
          : "Programar nueva cita médica"
      }
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-6 p-6">
          {/* Header Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/appointments")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Citas
            </Button>
          </div>

          {/* Form */}
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card className="card-modern h-full border-0 bg-gradient-to-br from-white to-gray-50/50 shadow-lg">
                <CardHeader className="border-b border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-primary" />
                    {isEditMode ? "Editar Cita Médica" : "Nueva Cita Médica"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Tabs defaultValue="general" className="w-full">
                    <div className="relative">
                      <TabsList className="scrollbar-thin flex w-full overflow-x-auto rounded-lg bg-muted/50 p-1">
                        <TabsTrigger
                          value="general"
                          className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap px-3 py-2 text-sm transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md sm:gap-2"
                        >
                          <Stethoscope className="h-4 w-4" />
                          <span className="hidden sm:inline">General</span>
                          <span className="sm:hidden">Gen</span>
                          {/* Punto indicador si hay datos principales llenos */}
                          {(formData.patientId || formData.workerId || formData.dateTime) && (
                            <span className="ml-1 inline-block h-2 w-2 rounded-full bg-green-500"></span>
                          )}
                        </TabsTrigger>
                        <TabsTrigger
                          value="products"
                          className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap px-3 py-2 text-sm transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md sm:gap-2"
                        >
                          <Pill className="h-4 w-4" />
                          <span className="hidden sm:inline">Productos</span>
                          <span className="sm:hidden">Prod</span>
                          {selectedProducts.length > 0 && (
                            <span className="ml-1 inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                          )}
                        </TabsTrigger>
                        <TabsTrigger
                          value="package"
                          className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap px-3 py-2 text-sm transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md sm:gap-2"
                        >
                          <PackageOpen className="h-4 w-4" />
                          <span className="hidden sm:inline">Paquete</span>
                          <span className="sm:hidden">Paq</span>
                          {selectedPackages.length > 0 && (
                            <span className="ml-1 inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                          )}
                          {patientPackagesForPatient.length > 0 && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-green-400 px-2 text-[10px] font-semibold text-white">{patientPackagesForPatient.filter((pp) => Number((pp as any)?.remainingSessions ?? 0) > 0).length}</span>
                          )}
                        </TabsTrigger>
                        <TabsTrigger
                          value="payment"
                          className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap px-3 py-2 text-sm transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md sm:gap-2"
                        >
                          <Wallet className="h-4 w-4" />
                          <span className="hidden sm:inline">Pago</span>
                          <span className="sm:hidden">Pag</span>
                          {selectedAbonos.length > 0 && (
                            <span className="ml-1 inline-block h-2 w-2 rounded-full bg-yellow-500"></span>
                          )}
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* General Tab */}
                    <TabsContent
                      value="general"
                      className="mt-6 space-y-6 duration-300 animate-in fade-in-50"
                    >
                      {/* Patient and Worker Selection */}
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Paciente *</Label>
                          <SearchableSelect
                            items={patients}
                            value={formData.patientId}
                            onValueChange={(value, item) => {
                              setSelectedPatient(item as Patient);
                              setFormData({ ...formData, patientId: value });
                              if (errors.patientId) {
                                setErrors({ ...errors, patientId: "" });
                              }
                            }}
                            selectedItem={selectedPatient}
                            placeholder="Seleccionar paciente"
                            displayField={(item) => {
                              const patient = item as Patient;
                              return `${patient?.firstName} ${patient?.paternalSurname} ${patient?.maternalSurname} - ${patient?.documentType.toLocaleUpperCase()}: ${patient?.documentNumber}`;
                            }}
                            searchFields={(item) => {
                              const patient = item as Patient;
                              return [
                                patient?.firstName,
                                patient?.paternalSurname,
                                patient?.maternalSurname,
                                patient?.documentNumber,
                                patient?.phone,
                              ];
                            }}
                            emptyText="No se encontraron pacientes"
                            fetchItems={async (search: string) => {
                              // Use patientRepository to query backend when searching
                              try {
                                const resp = await patientRepository.getAll({
                                  page: 1,
                                  limit: 10,
                                  search,
                                });
                                return resp.items;
                              } catch (err) {
                                console.error("Error buscando pacientes:", err);
                                return [];
                              }
                            }}
                          />
                          {errors.patientId && (
                            <p className="text-sm text-destructive">
                              {errors.patientId}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Trabajador *</Label>
                          <SearchableSelect
                            items={workers}
                            value={formData.workerId}
                            onValueChange={(value) => {
                              setFormData({ ...formData, workerId: value });
                              if (errors.workerId) {
                                setErrors({ ...errors, workerId: "" });
                              }
                            }}
                            placeholder="Seleccionar trabajador"
                            displayField={(item) => {
                              const worker = item as Worker;
                              return `${worker.firstName} ${worker.lastName}`;
                            }}
                            searchFields={(item) => {
                              const worker = item as Worker;
                              return [
                                worker.firstName,
                                worker.lastName,
                                worker.email,
                                worker.specialization || "",
                              ];
                            }}
                            emptyText="No se encontraron trabajadores"
                          />
                          {errors.workerId && (
                            <p className="text-sm text-destructive">
                              {errors.workerId}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Date, Time and Duration */}
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="dateTime">Fecha y Hora *</Label>
                          <Input
                            id="dateTime"
                            type="datetime-local"
                            value={formData.dateTime}
                            min={getMinDateTime()}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                dateTime: e.target.value,
                              });
                              if (errors.dateTime) {
                                setErrors({ ...errors, dateTime: "" });
                              }
                            }}
                            className={cn(
                              errors.dateTime && "border-destructive",
                            )}
                          />
                          {errors.dateTime && (
                            <p className="text-sm text-destructive">
                              {errors.dateTime}
                            </p>
                          )}
                        </div>

                        {/* duration field removed */}
                      </div>

                      {/* Diagnosis */}
                      <div className="space-y-2">
                        <Label htmlFor="diagnosis">Diagnóstico *</Label>
                        <SearchableTextInput
                          options={PREDEFINED_DIAGNOSES}
                          value={formData.diagnosis || ""}
                          onValueChange={(value) => {
                            setFormData({
                              ...formData,
                              diagnosis: value,
                            });
                            if (errors.diagnosis) {
                              setErrors({ ...errors, diagnosis: "" });
                            }
                          }}
                          placeholder="Selecciona o escribe un diagnóstico..."
                          label="diagnóstico"
                        />
                        {errors.diagnosis && (
                          <p className="text-sm text-destructive">
                            {errors.diagnosis}
                          </p>
                        )}
                      </div>

                      {/* Treatment */}
                      <div className="space-y-2">
                        <Label htmlFor="treatmentNotes">Tratamiento *</Label>
                        <SearchableTextInput
                          options={PREDEFINED_TREATMENTS}
                          value={formData.treatmentNotes || ""}
                          onValueChange={(value) => {
                            setFormData({
                              ...formData,
                              treatmentNotes: value,
                            });
                            if (errors.treatmentNotes) {
                              setErrors({ ...errors, treatmentNotes: "" });
                            }
                          }}
                          placeholder="Selecciona o describe el tratamiento..."
                          label="tratamiento"
                        />
                        {errors.treatmentNotes && (
                          <p className="text-sm text-destructive">
                            {errors.treatmentNotes}
                          </p>
                        )}
                      </div>

                      {/* Treatment Price */}
                      <div className="space-y-2">
                        <Label htmlFor="treatmentPrice">
                          Precio del Tratamiento (opcional)
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                          <Input
                            id="treatmentPrice"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.treatmentPrice || ""}
                            onChange={(e) => {
                              const value = e.target.value
                                ? parseFloat(e.target.value)
                                : undefined;
                              setFormData({
                                ...formData,
                                treatmentPrice: value,
                              });
                            }}
                            placeholder="0.00"
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* Observations */}
                      <div className="space-y-2">
                        <Label htmlFor="observations">Observaciones</Label>
                        <Textarea
                          id="observations"
                          value={formData.observation || ""}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              observation: e.target.value,
                            });
                          }}
                          placeholder="Observaciones adicionales, notas especiales..."
                          rows={3}
                        />
                      </div>
                    </TabsContent>

                    {/* Products Tab */}
                    <TabsContent
                      value="products"
                      className="mt-6 space-y-6 duration-300 animate-in fade-in-50"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">
                            Buscar y Agregar Productos
                          </Label>
                          <Badge variant="outline">
                            {selectedProducts.length} en carrito
                          </Badge>
                        </div>

                        {/* Search and Filter Controls */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {/* Search Input */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                            <Input
                              placeholder="Buscar productos..."
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              className="pl-10"
                            />
                          </div>

                          {/* Category Filter */}
                          <Select
                            value={selectedCategory}
                            onValueChange={setSelectedCategory}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Filtrar por categoría" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">
                                Todas las categorías
                              </SelectItem>
                              {categories.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id}
                                >
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Product Selection Grid */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {filteredProducts.length > 0 ? (
                            paginatedProducts.map((product) => {
                              const cartItem = selectedProducts.find(
                                (sp) => sp.product.id === product.id,
                              );
                              const isSelected = Boolean(cartItem);
                              return (
                                <div
                                  key={product.id}
                                  className={cn(
                                    "rounded-lg border p-6 transition-all duration-300",
                                    "hover:scale-[1.02] hover:shadow-md",
                                    isSelected
                                      ? "bg-gradient-to-r from-primary/10 to-primary/5 border-primary shadow-md"
                                      : "hover:bg-muted/30",
                                  )}
                                >
                                  {/* Indicador de cantidad en carrito */}
                                  {isSelected && (
                                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                                      <Check className="h-3 w-3" />
                                      <span>{cartItem?.quantity}</span>
                                    </div>
                                  )}

                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="mb-2 flex flex-col items-start justify-between">
                                        {product.category && (
                                          <Badge
                                            variant="secondary"
                                            className="mb-3 text-xs"
                                          >
                                            {product.category.name}
                                          </Badge>
                                        )}
                                        <h4 className="font-medium">
                                          {product.name}
                                        </h4>
                                      </div>
                                      {product.description && (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                          {product.description}
                                        </p>
                                      )}
                                      <div className="mt-2 flex items-center justify-between">
                                        <p className="text-sm font-medium text-primary">
                                          S/ {product.price.toFixed(2)}
                                        </p>
                                      </div>
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        Stock: {product.stock}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-3 flex justify-end">
                                    {isSelected ? (
                                      <div className="flex items-center gap-2">
                                        <Button
                                          onClick={() => updateProductQuantity(product.id, (cartItem?.quantity || 1) - 1)}
                                          size="sm"
                                          variant="outline"
                                          className="flex h-8 w-8 items-center justify-center p-0"
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>

                                        <span className="min-w-[2.5rem] text-center font-medium">
                                          {cartItem?.quantity}
                                        </span>

                                        <Button
                                          onClick={() => updateProductQuantity(product.id, (cartItem?.quantity || 0) + 1)}
                                          size="sm"
                                          variant="default"
                                          disabled={product.stock === 0}
                                          className="flex h-8 w-8 items-center justify-center p-0"
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        onClick={() => addProduct(product)}
                                        size="sm"
                                        variant="outline"
                                        disabled={product.stock === 0}
                                        className="flex items-center gap-1"
                                      >
                                        <Plus className="h-4 w-4" />
                                        Agregar
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="col-span-2 py-8 text-center text-muted-foreground">
                              <PackageIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
                              <p>No se encontraron productos</p>
                              <p className="text-sm">
                                Intenta ajustar tu búsqueda o filtro
                              </p>
                            </div>
                          )}
                        </div>
                        {totalProductPages > 1 && (
                          <div className="mt-4 flex justify-center gap-2">
                            <Button size="sm" variant="outline" disabled={productPage === 1} onClick={() => setProductPage(productPage - 1)}>
                              &lt;
                            </Button>
                            {Array.from({ length: totalProductPages }).map((_, i) => (
                              <Button
                                key={i}
                                size="sm"
                                variant={productPage === i + 1 ? "default" : "ghost"}
                                onClick={() => setProductPage(i + 1)}
                                className={productPage === i + 1 ? "bg-pink-400 text-white" : ""}
                              >
                                {i + 1}
                              </Button>
                            ))}
                            <Button size="sm" variant="outline" disabled={productPage === totalProductPages} onClick={() => setProductPage(productPage + 1)}>
                              &gt;
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Package Tab */}
                    <TabsContent
                      value="package"
                      className="mt-6 space-y-6 duration-300 animate-in fade-in-50"
                    >
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">
                          Paquetes Disponibles
                        </Label>

                        {/* Grid de paquetes - siempre una columna (mobile-first) */}
                        {patientPackagesForPatient.length > 0 && (
                          <div className="flex gap-2">
                            <Button size="sm" variant={packageView === 'inuse' ? 'default' : 'ghost'} onClick={() => setPackageView('inuse')}>
                              Paquetes en uso ({patientPackagesForPatient.filter((pp) => Number((pp as any)?.remainingSessions ?? 0) > 0).length})
                            </Button>
                            <Button size="sm" variant={packageView === 'more' ? 'default' : 'ghost'} onClick={() => setPackageView('more')}>
                              Más paquetes ({itemsForPackageView.length})
                            </Button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                          {visiblePackageItems.length > 0 ? (
                            visiblePackageItems.map(({ pkg, pp }) => {
                              const isOwned = !!pp;
                              const isSelected = selectedPackages.some((p) => p.id === pkg.id);

                              const remaining = Number((pp as any)?.remainingSessions ?? 0);
                              const totalPrice = Number((pp as any)?.packagePrice ?? (pkg as any).price ?? 0); // packagePrice = costo total del paquete
                              const totalSessions = Number((pkg as any).sessions ?? (pp as any)?.remainingSessions ?? 1);
                              const usedSessions = Math.max(0, Number(totalSessions) - Number(remaining));
                              const usedPercent = totalSessions > 0 ? Math.max(0, Math.min(100, Math.round((usedSessions / totalSessions) * 100))) : 0;
                              const debt = typeof (pp as any)?.debt !== 'undefined' ? Number((pp as any).debt) : undefined;
                              const appliedAmount = packageSessionAmounts[pkg.id];

                              return (
                                <div
                                  key={pkg.id || pkg.name}
                                  className={cn(
                                    "rounded-lg p-4 transition-all duration-200 bg-white border shadow-sm flex flex-col justify-between h-full",
                                    isSelected
                                      ? "border-primary/30 shadow-lg border-l-4 border-l-primary"
                                      : "hover:shadow-md",
                                  )}
                                >
                                  {/* Header: title + price */}
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-start gap-3">
                                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                        <PackageIcon className="h-5 w-5" />
                                      </div>
                                      <div className="min-w-0">
                                        <h4 className="truncate text-sm font-medium text-slate-800">{pkg.name}</h4>
                                        {pkg.description && (
                                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground" title={pkg.description}>{pkg.description}</p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex-shrink-0 text-right">
                                      <div className="text-xs text-slate-500">Total</div>
                                      <div className="text-lg font-bold text-primary">S/ {totalPrice.toFixed(2)}</div>
                                    </div>
                                  </div>

                                  {/* Body: badges + optional debt + progress */}
                                  <div className="mt-3">
                                    {packageView === 'more' ? (
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="inline-flex items-center rounded-full border bg-white px-2 py-0.5 text-xs text-slate-700">Totales: {totalSessions}</div>
                                        <div className="text-xs text-slate-500">Total paquete: S/ {totalPrice.toFixed(2)}</div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-center justify-between gap-3">
                                          <div className="flex items-center gap-2">

                                            {/* Total sessions (secondary) */}
                                            <span className="inline-flex items-center rounded-full border bg-white px-2 py-0.5 text-xs text-slate-700" title={`Total de sesiones`}>
                                              Total de Sesiones: {totalSessions}
                                            </span>

                                            {/* Remaining sessions (highlighted for the client) */}
                                            <span className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white ring-1 ring-emerald-200" title={`Sesiones restantes`}>
                                              {remaining} sesiones
                                            </span>


                                            {typeof debt !== 'undefined' && (
                                              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs", debt > 0 ? "bg-destructive text-white" : "bg-secondary text-white")}>
                                                Deuda: S/ {debt?.toFixed(2)}
                                              </span>
                                            )}
                                          </div>

                                          <div className="text-xs text-slate-500">Total paquete: S/ {totalPrice.toFixed(2)}</div>
                                        </div>

                                        {/* Progress bar showing used sessions */}
                                        <div className="mt-2 w-full">
                                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/30">
                                            <div
                                              className="h-2 rounded-full bg-emerald-500 transition-all"
                                              style={{ width: `${usedPercent}%` }}
                                              title={`${usedSessions} usadas — ${usedPercent}%`}
                                            />
                                          </div>
                                          <div className="mt-1 text-xs text-slate-500">Usadas: {usedSessions} · Disponibles: {remaining}</div>
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  {/* Footer: amount */}
                                  <div className="mt-8 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      {
                                        isOwned && packageView === 'more' && remaining > 0 ?
                                          null :
                                          (isSelected) && (
                                            debt == 0 ?
                                              <div className="text-lg text-slate-600">El paquete esta pagado.</div>
                                              :
                                              <>
                                                <div className="text-lg text-slate-600">Abono:</div>
                                                <div className="relative">
                                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">S/</span>
                                                  <Input
                                                    type="number"
                                                    step="0.01"
                                                    min={0}
                                                    value={(() => {
                                                      const maxAllowed = isOwned ? (typeof debt !== 'undefined' ? debt : totalPrice) : totalPrice;
                                                      const defaultAmount = isOwned ? (typeof debt !== 'undefined' ? debt : totalPrice) : totalPrice;
                                                      return appliedAmount !== undefined ? appliedAmount : Number(defaultAmount.toFixed(2));
                                                    })()}
                                                    onChange={(e) => {
                                                      const raw = e.target.value;
                                                      let val = raw ? parseFloat(raw) : 0;
                                                      const maxAllowed = isOwned ? (typeof debt !== 'undefined' ? debt : totalPrice) : totalPrice;
                                                      if (isNaN(val)) val = 0;
                                                      if (val > maxAllowed) val = maxAllowed;
                                                      if (val < 0) val = 0;
                                                      setPackageSessionAmounts((prev) => ({ ...prev, [pkg.id]: Number(val.toFixed(2)) }));
                                                    }}
                                                    className="w-28 pl-10"
                                                  />
                                                </div>
                                              </>
                                          )}
                                    </div>

                                    <div className="flex-shrink-0">
                                      {isOwned && packageView === 'more' && remaining > 0 ? (
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          disabled
                                          className="flex cursor-not-allowed items-center gap-2 opacity-70"
                                        >
                                          <Trash className="h-4 w-4 text-red-400" />
                                          <span>El paquete ya está siendo usado por el cliente</span>
                                        </Button>
                                      ) : (
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant={isSelected ? "outline" : "default"}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (isSelected) {
                                              setSelectedPackages(selectedPackages.filter((p) => p.id !== pkg.id));
                                              setPackageSessionAmounts((prev) => {
                                                const copy = { ...prev };
                                                delete copy[pkg.id];
                                                return copy;
                                              });
                                            } else {
                                              setSelectedPackages([...selectedPackages, pkg]);
                                              // Default abono: si el paquete es del cliente usar la deuda (si existe), si no usar el precio total
                                              const defaultAbono = isOwned ? (typeof debt !== 'undefined' ? debt : totalPrice) : totalPrice;
                                              setPackageSessionAmounts((prev) => ({ ...prev, [pkg.id]: Number(defaultAbono.toFixed(2)) }));
                                            }
                                          }}
                                          className={cn(
                                            "flex items-center gap-2",
                                            isSelected ? "bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-700 border border-red-200" : "",
                                          )}
                                        >
                                          {isSelected ? (
                                            <>
                                              <Trash className="h-4 w-4 text-red-600" />
                                              <span>Quitar</span>
                                            </>
                                          ) : (
                                            <>
                                              <Plus className="h-4 w-4" />
                                              Usar
                                            </>
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="py-8 text-center text-muted-foreground">
                              <PackageIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
                              <p>No hay paquetes disponibles en esta sección</p>
                              <p className="text-sm">Puedes cambiar de pestaña o crear paquetes desde la sección de Paquetes</p>
                            </div>
                          )}
                        </div>
                        {packageView === 'more' && totalPackagePages > 1 && (
                          <div className="mt-4 flex justify-center gap-2">
                            <Button size="sm" variant="outline" disabled={packageApiPage === 1} onClick={() => setPackageApiPage(packageApiPage - 1)}>
                              &lt;
                            </Button>
                            {Array.from({ length: totalPackagePages }).map((_, i) => (
                              <Button
                                key={i}
                                size="sm"
                                variant={packageApiPage === i + 1 ? "default" : "ghost"}
                                onClick={() => setPackageApiPage(i + 1)}
                                className={packageApiPage === i + 1 ? "bg-pink-400 text-white" : ""}
                              >
                                {i + 1}
                              </Button>
                            ))}
                            <Button size="sm" variant="outline" disabled={packageApiPage === totalPackagePages} onClick={() => setPackageApiPage(packageApiPage + 1)}>
                              &gt;
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Payment Tab */}
                    <TabsContent
                      value="payment"
                      className="mt-6 space-y-6 duration-300 animate-in fade-in-50"
                    >
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">
                          Resumen de Pago
                        </Label>
                        {selectedAbonos.length === 0 ? (
                          <div className="py-8 text-center text-muted-foreground">
                            <Wallet className="mx-auto mb-4 h-12 w-12 opacity-50" />
                            <p>No hay abonos seleccionados</p>
                            <p className="text-sm">
                              Ve a la pestaña "Abonos" para agregar
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {selectedAbonos.map(({ abono, amountToUse }) => (
                              <div
                                key={abono.id}
                                className="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-3"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-green-800">
                                      {abono.method.toUpperCase()}
                                    </p>
                                    <p className="text-xs text-green-600">
                                      Disponible: S/{" "}
                                      {abono.remainingAmount.toFixed(2)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-green-800">
                                      S/ {amountToUse.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Summary Panel with Tabs */}
            <div className="lg:col-span-1">
              <div className="space-y-4 lg:sticky lg:top-6">
                {/* Action Buttons - Always visible at top */}
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    size="lg"
                    className="btn-primary mb-2 flex w-full items-center gap-3 shadow-lg transition-all duration-300 hover:shadow-xl"
                  >
                    {isSaving ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                        {isEditMode ? "Actualizando..." : "Guardando..."}
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        {isEditMode ? "Actualizar Cita" : "Registrar Cita"}
                      </>
                    )}
                  </Button>
                  {/* 
                  <Button
                    variant="secondary"
                    onClick={() => {
                      console.log("Draft saved:", formData);
                      toast({ title: "Borrador guardado exitosamente" });
                    }}
                    disabled={isSaving}
                    size="lg"
                    className="flex w-full items-center gap-3 shadow-md transition-all duration-300 hover:shadow-lg"
                  >
                    <Save className="h-5 w-5" />
                    Guardar Borrador
                  </Button> */}
                </div>

                {/* Tabbed Summary Panel */}
                <Card className="card-modern shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Resumen de la Cita
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-hidden p-0">
                    <Tabs defaultValue="general" className="w-full">
                      <div className="relative m-4 mb-0">
                        <TabsList className="scrollbar-thin flex w-full overflow-x-auto rounded-lg bg-muted/50 p-1">
                          <TabsTrigger
                            value="general"
                            className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap px-2 text-xs transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm sm:gap-2 sm:px-3 sm:text-sm"
                          >
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">General</span>
                            <span className="sm:hidden">Gen</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="products"
                            className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap px-2 text-xs transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm sm:gap-2 sm:px-3 sm:text-sm"
                          >
                            <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Productos</span>
                            <span className="sm:hidden">Prod</span>
                            {selectedProducts.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="ml-1 flex h-4 min-w-[1rem] items-center justify-center px-1 text-xs"
                              >
                                {selectedProducts.length}
                              </Badge>
                            )}
                          </TabsTrigger>
                          <TabsTrigger
                            value="package"
                            className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap px-2 text-xs transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm sm:gap-2 sm:px-3 sm:text-sm"
                          >
                            <PackageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Paquete</span>
                            <span className="sm:hidden">Paq</span>
                            {selectedPackages.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="ml-1 flex h-4 min-w-[1rem] items-center justify-center px-1 text-xs"
                              >
                                {selectedPackages.length}
                              </Badge>
                            )}
                          </TabsTrigger>
                          <TabsTrigger
                            value="payment"
                            className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap px-2 text-xs transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm sm:gap-2 sm:px-3 sm:text-sm"
                          >
                            <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Pago</span>
                            <span className="sm:hidden">Pag</span>
                            {selectedAbonos.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="ml-1 flex h-4 min-w-[1rem] items-center justify-center px-1 text-xs"
                              >
                                {selectedAbonos.length}
                              </Badge>
                            )}
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      {/* General Tab */}
                      <TabsContent
                        value="general"
                        className="max-w-full space-y-3 overflow-hidden p-3 duration-300 animate-in fade-in-50 sm:space-y-4 sm:p-4"
                      >
                        {formData.patientId && (
                          <div className="flex min-w-0 items-center gap-3 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-3 transition-all duration-300">
                            <User className="h-5 w-5 flex-shrink-0 text-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">Paciente</p>
                              <p className="truncate text-sm text-muted-foreground">
                                {(() => {
                                  const patient = selectedPatient;
                                  return patient
                                    ? `${patient.firstName} ${patient.paternalSurname} ${patient.maternalSurname}`
                                    : "";
                                })()}
                              </p>
                            </div>
                          </div>
                        )}

                        {formData.workerId && (
                          <div className="flex min-w-0 items-center gap-3 rounded-lg border border-secondary/20 bg-gradient-to-r from-secondary/10 to-secondary/5 p-3 transition-all duration-300">
                            <Users className="h-5 w-5 flex-shrink-0 text-secondary" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">Trabajador</p>
                              <p className="truncate text-sm text-muted-foreground">
                                {(() => {
                                  const worker = workers.find(
                                    (w) => w.id === formData.workerId,
                                  );
                                  return worker
                                    ? `${worker.firstName} ${worker.lastName}`
                                    : "";
                                })()}
                              </p>
                            </div>
                          </div>
                        )}

                        {formData.dateTime && (
                          <div className="flex min-w-0 items-center gap-3 rounded-lg border border-accent/20 bg-gradient-to-r from-accent/10 to-accent/5 p-3 transition-all duration-300">
                            <Clock className="h-5 w-5 flex-shrink-0 text-accent" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">
                                Fecha y Hora
                              </p>
                              <p className="break-words text-sm text-muted-foreground">
                                {new Date(formData.dateTime).toLocaleString(
                                  "es-ES",
                                  {
                                    weekday: "short",
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        )}

                        {formData.diagnosis && (
                          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                            <Stethoscope className="mt-0.5 h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-blue-800">
                                Diagnóstico
                              </p>
                              <p className="text-sm text-blue-600">
                                {formData.diagnosis}
                              </p>
                            </div>
                          </div>
                        )}

                        {formData.treatmentNotes && (
                          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                            <FileEdit className="mt-0.5 h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium text-green-800">
                                Tratamiento
                              </p>
                              <p className="text-sm text-green-600">
                                {formData.treatmentNotes}
                              </p>
                            </div>
                          </div>
                        )}

                        {formData.treatmentPrice &&
                          formData.treatmentPrice > 0 ? (
                            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                              <DollarSign className="mt-0.5 h-5 w-5 text-emerald-600" />
                              <div>
                                <p className="font-medium text-emerald-800">
                                  Precio del Tratamiento
                                </p>
                                <p className="text-sm text-emerald-600">
                                  S/ {formData.treatmentPrice.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ) : null
                        }

                        {formData.observation && (
                          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <FileText className="mt-0.5 h-5 w-5 text-amber-600" />
                            <div>
                              <p className="font-medium text-amber-800">
                                Observaciones
                              </p>
                              <p className="text-sm text-amber-600">
                                {formData.observation}
                              </p>
                            </div>
                          </div>
                        )}

                        {!formData.patientId &&
                          !formData.workerId &&
                          !formData.dateTime && (
                            <div className="py-8 text-center text-muted-foreground">
                              <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
                              <p>Completa los datos para ver el resumen</p>
                            </div>
                          )}
                      </TabsContent>

                      {/* Products Tab */}
                      <TabsContent
                        value="products"
                        className="max-w-full space-y-3 overflow-hidden p-3 duration-300 animate-in fade-in-50 sm:space-y-4 sm:p-4"
                      >
                        {selectedProducts.length > 0 ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">
                                Carrito de Productos
                              </h3>
                              <Badge variant="outline">
                                {selectedProducts.length} productos
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              {selectedProducts.map(({ product, quantity }) => (
                                <div
                                  key={product.id}
                                  className="min-w-0 rounded-lg border bg-gradient-to-r from-muted/30 to-muted/20 p-3 transition-all duration-300 hover:shadow-sm"
                                >
                                  <div className="mb-2 flex min-w-0 items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                      <h4 className="truncate text-sm font-medium">
                                        {product.name}
                                      </h4>
                                      <p className="text-xs text-muted-foreground">
                                        S/ {product.price.toFixed(2)} c/u
                                      </p>
                                    </div>
                                    <Button
                                      onClick={() => removeProduct(product.id)}
                                      size="sm"
                                      variant="ghost"
                                      className="ml-2 h-6 w-6 flex-shrink-0 p-0 text-red-600 hover:bg-red-100 hover:text-red-700"
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        onClick={() =>
                                          updateProductQuantity(
                                            product.id,
                                            quantity - 1,
                                          )
                                        }
                                        size="sm"
                                        variant="outline"
                                        className="h-6 w-6 p-0"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="w-8 text-center text-sm font-medium">
                                        {quantity}
                                      </span>
                                      <Button
                                        onClick={() =>
                                          updateProductQuantity(
                                            product.id,
                                            quantity + 1,
                                          )
                                        }
                                        size="sm"
                                        variant="outline"
                                        className="h-6 w-6 p-0"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <span className="font-bold text-primary">
                                      S/ {(product.price * quantity).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="border-t pt-3">
                              <div className="flex items-center justify-between">
                                <span className="font-bold">
                                  Total productos:
                                </span>
                                <span className="text-lg font-bold text-primary">
                                  S/{" "}
                                  {selectedProducts
                                    .reduce(
                                      (sum, sp) =>
                                        sum + sp.product.price * sp.quantity,
                                      0,
                                    )
                                    .toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-8 text-center text-muted-foreground">
                            <ShoppingBag className="mx-auto mb-4 h-12 w-12 opacity-50" />
                            <p>No hay productos seleccionados</p>
                            <p className="text-sm">
                              Ve a la pestaña "Productos" para agregar
                            </p>
                          </div>
                        )}
                      </TabsContent>

                      {/* Package Tab */}
                      <TabsContent
                        value="package"
                        className="max-w-full space-y-3 overflow-hidden p-3 duration-300 animate-in fade-in-50 sm:space-y-4 sm:p-4"
                      >
                        {selectedPackages.length > 0 ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">
                                Paquetes Seleccionados
                              </h3>
                              <Badge variant="outline">
                                {selectedPackages.length} paquetes
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              {selectedPackages.map((pkg) => (
                                <div
                                  key={pkg.id}
                                  className="rounded-lg border bg-gradient-to-r from-muted/30 to-muted/20 p-3 transition-all duration-300 hover:shadow-sm"
                                >
                                  <div className="mb-2 flex items-start justify-between">
                                    <div>
                                      <h4 className="font-medium">{pkg.name}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        Sesiones: {pkg.sessions}
                                      </p>
                                    </div>
                                    <Button
                                      onClick={() =>
                                        setSelectedPackages(
                                          selectedPackages.filter(
                                            (p) => p.id !== pkg.id,
                                          ),
                                        )
                                      }
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 hover:text-red-700"
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-primary">
                                      Abono: S/ {(typeof packageSessionAmounts[pkg.id] !== 'undefined' ? packageSessionAmounts[pkg.id] : (pkg.price || 0)).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="border-t pt-3">
                              <div className="flex items-center justify-between">
                                <span className="font-bold">
                                  Total paquetes:
                                </span>
                                <span className="text-lg font-bold text-primary">
                                  S/ {selectedPackages.reduce((sum, pkg) => {
                                    const amt = typeof packageSessionAmounts[pkg.id] !== 'undefined' ? packageSessionAmounts[pkg.id] : (pkg.price || 0);
                                    return sum + Number(amt || 0);
                                  }, 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-8 text-center text-muted-foreground">
                            <PackageIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
                            <p>No hay paquetes seleccionados</p>
                            <p className="text-sm">
                              Ve a la pestaña "Paquete" para asignar
                            </p>
                          </div>
                        )}
                      </TabsContent>

                      {/* Payment Tab */}
                      <TabsContent
                        value="payment"
                        className="max-w-full space-y-3 overflow-hidden p-3 duration-300 animate-in fade-in-50 sm:space-y-4 sm:p-4"
                      >
                        {getTotalCost() > 0 ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">Resumen de Pago</h3>
                            </div>

                            {/* Cost Breakdown */}
                            <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                              <div className="flex justify-between text-sm">
                                <span>Costo total:</span>
                                <span className="font-medium">
                                  S/ {getTotalCost().toFixed(2)}
                                </span>
                              </div>
                              {getTotalAbonoAmount() > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                  <span>Abonos aplicados:</span>
                                  <span className="font-medium">
                                    -S/ {getTotalAbonoAmount().toFixed(2)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between border-t border-blue-300 pt-2">
                                <span className="font-bold">
                                  Saldo restante:
                                </span>
                                <span className="text-lg font-bold text-blue-800">
                                  S/ {getRemainingBalance().toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {/* Selected Abonos */}
                            {selectedAbonos.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-green-800">
                                  Abonos a Usar:
                                </h4>
                                {selectedAbonos.map(
                                  ({ abono, amountToUse }) => (
                                    <div
                                      key={abono.id}
                                      className="rounded-lg border border-green-200 bg-green-50 p-3"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <p className="font-medium text-green-800">
                                            {abono.method.toUpperCase()}
                                          </p>
                                          <p className="text-xs text-green-600">
                                            Disponible: S/{" "}
                                            {abono.remainingAmount.toFixed(2)}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-bold text-green-800">
                                            S/ {amountToUse.toFixed(2)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}

                            {/* Payment Methods Suggestion */}
                            {getRemainingBalance() > 0 && (
                              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                <p className="text-sm text-amber-800">
                                  <strong>Saldo pendiente:</strong> S/{" "}
                                  {getRemainingBalance().toFixed(2)}
                                </p>
                                <p className="mt-1 text-xs text-amber-600">
                                  Deberá ser pagado con efectivo, tarjeta u otro
                                  método al momento de la cita.
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-muted-foreground">
                            <Wallet className="mx-auto mb-4 h-12 w-12 opacity-50" />
                            <p>No hay costos que mostrar</p>
                            <p className="text-sm">
                              Agrega productos o precio de tratamiento
                            </p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>

                    {/* Total Cost Summary - Always at bottom */}
                    {(selectedProducts.length > 0 ||
                      (selectedPackages.length > 0) ||
                      (formData.treatmentPrice &&
                        formData.treatmentPrice > 0)) ? (
                        <div className="border-t bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <h3 className="font-bold text-green-800">
                              Resumen de Costos
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {formData.treatmentPrice &&
                              formData.treatmentPrice > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-sm">
                                    Precio del tratamiento:
                                  </span>
                                  <span className="text-sm font-medium">
                                    S/ {formData.treatmentPrice.toFixed(2)}
                                  </span>
                                </div>
                              )}
                            {selectedProducts.length > 0 && (
                              <div className="flex justify-between">
                                <span className="text-sm">Total productos:</span>
                                <span className="text-sm font-medium">
                                  S/{" "}
                                  {selectedProducts
                                    .reduce(
                                      (sum, sp) =>
                                        sum + sp.product.price * sp.quantity,
                                      0,
                                    )
                                    .toFixed(2)}
                                </span>
                              </div>
                            )}
                            {selectedPackages.length > 0 && (
                              <div className="flex justify-between">
                                <span className="text-sm">Total paquetes:</span>
                                <span className="text-sm font-medium text-green-600">
                                  S/ {selectedPackages.reduce((sum, pkg) => {
                                    const amt = typeof packageSessionAmounts[pkg.id] !== 'undefined' ? packageSessionAmounts[pkg.id] : (pkg.price || 0);
                                    return sum + Number(amt || 0);
                                  }, 0).toFixed(2)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-green-300 pt-2">
                              <span className="font-bold text-green-800">
                                Total estimado:
                              </span>
                              <span className="text-xl font-bold text-green-800">
                                S/ {getTotalCost().toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : null}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout >
  );
}

export default CreateAppointment;
