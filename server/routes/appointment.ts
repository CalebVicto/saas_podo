import { Router, RequestHandler } from "express";

// Simple in-memory placeholder for appointments
interface AppointmentRecord {
  id: string;
  status: "registered" | "paid" | "canceled";
  paymentMethod?: "cash" | "transfer" | "yape" | "pos";
  paidAt?: string;
  appointmentPrice: number;
  treatmentPrice?: number;
  saleId?: string | null;
}

const appointments: Record<string, AppointmentRecord> = {};

const router = Router();

const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  next();
};

// Register payment for an appointment
router.put<"/:id/payment">("/:id/payment", requireAuth, (req, res) => {
  const { id } = req.params;
  const { paymentMethod } = req.body as { paymentMethod?: AppointmentRecord["paymentMethod"] };
  const allowedMethods = ["cash", "transfer", "yape", "pos"] as const;

  if (!paymentMethod || !allowedMethods.includes(paymentMethod)) {
    return res.status(400).json({ status: "error", message: "Invalid payment method" });
  }

  const paidAt = new Date().toISOString();
  const existing = appointments[id] || { id, appointmentPrice: 0 };
  appointments[id] = {
    ...existing,
    status: "paid",
    paymentMethod,
    paidAt,
  };

  return res.json({ status: "success", message: "Payment registered", data: appointments[id] });
});

// Update appointment data
router.put<"/:id">("/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const {
    patientId,
    diagnosis,
    treatment,
    treatmentPrice = 0,
    observation,
    products = [],
    foot_inf,
    foot_post,
    paymentMethod,
  } = req.body as any;

  const productsTotal = Array.isArray(products)
    ? products.reduce(
        (sum: number, p: any) => sum + (p.price || 0) * (p.quantity || 0),
        0
      )
    : 0;

  const appointmentPrice = Number(treatmentPrice) + productsTotal;

  let status: AppointmentRecord["status"] = "registered";
  let paidAt: string | undefined;
  let finalPaymentMethod = paymentMethod as AppointmentRecord["paymentMethod"] | undefined;
  let saleId: string | null | undefined;

  if (appointmentPrice === 0) {
    status = "paid";
    paidAt = new Date().toISOString();
    if (!finalPaymentMethod) {
      finalPaymentMethod = "cash";
    }
  }

  if (Array.isArray(products) && products.length > 0) {
    saleId = `sale-${Date.now()}`;
  }

  appointments[id] = {
    id,
    status,
    paymentMethod: finalPaymentMethod,
    paidAt,
    appointmentPrice,
    treatmentPrice,
    saleId,
  };

  return res.json({
    status: "success",
    message: "Appointment updated",
    data: {
      id,
      patientId,
      diagnosis,
      treatment,
      treatmentPrice,
      observation,
      products,
      foot_inf,
      foot_post,
      appointmentPrice,
      status,
      paymentMethod: finalPaymentMethod,
      paidAt,
      saleId,
    },
  });
});

// Cancel appointment
router.delete<"/:id">("/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const existing = appointments[id];
  if (!existing) {
    return res.status(404).json({ status: "error", message: "Appointment not found" });
  }

  let { saleId, appointmentPrice = 0, treatmentPrice } = existing;
  if (saleId) {
    // Placeholder for sale cancellation and kardex update
    saleId = null;
  }

  appointments[id] = {
    ...existing,
    status: "canceled",
    saleId,
    appointmentPrice,
    treatmentPrice,
  };

  return res.json({
    status: "success",
    message: "Cita cancelada correctamente",
    data: {
      id,
      status: "canceled",
      appointmentPrice,
      treatmentPrice,
      saleId,
    },
  });
});

export default router;

