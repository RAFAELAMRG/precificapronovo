-- AlterTable
ALTER TABLE "products" ADD COLUMN     "production_cost_id" TEXT;

-- CreateTable
CREATE TABLE "production_costs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "custo_tipo" TEXT NOT NULL,
    "detalhes_custo" TEXT NOT NULL,
    "custo_total" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_costs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "production_costs_company_id_sku_key" ON "production_costs"("company_id", "sku");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_production_cost_id_fkey" FOREIGN KEY ("production_cost_id") REFERENCES "production_costs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_costs" ADD CONSTRAINT "production_costs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
