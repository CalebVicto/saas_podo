import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Product, ProductMovement } from "../../shared/api";

// Utilidad para obtener el resumen del kardex
export const kardexSummaryHandler = async (req: Request, res: Response) => {
  try {
    // Obtener movimientos de productos
    const movementRepo = getRepository(ProductMovement);
    const productRepo = getRepository(Product);

    // Total de entradas
    const totalEntries = await movementRepo
      .createQueryBuilder("movement")
      .where("movement.type = :type", { type: "entrada" })
      .select("SUM(movement.quantity)", "sum")
      .getRawOne();

    // Total de salidas
    const totalExits = await movementRepo
      .createQueryBuilder("movement")
      .where("movement.type = :type", { type: "salida" })
      .select("SUM(movement.quantity)", "sum")
      .getRawOne();

    // Valor total de inventario
    const products = await productRepo.find();
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + (p.price || 0) * (p.stock || 0),
      0
    );

    // Productos con bajo stock (<= 5 y > 0)
    const lowStock = products.filter((p) => p.stock <= 5 && p.stock > 0);

    return res.json({
      state: "success",
      message: "Resumen de inventario",
      data: {
        totalEntries: Number(totalEntries.sum) || 0,
        totalExits: Number(totalExits.sum) || 0,
        totalInventoryValue,
        lowStock,
      },
    });
  } catch (error) {
    return res.status(500).json({
      state: "error",
      message: "Error al obtener el resumen de inventario",
      error: error.message,
    });
  }
};

// Express route
import { Router } from "express";
const router = Router();

router.get("/summary", kardexSummaryHandler);

export default router;
