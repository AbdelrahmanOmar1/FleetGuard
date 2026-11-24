const { PrismaPg } = require("@prisma/adapter-pg");
const prismaConfig = require("../prisma.config");
const prismaPromise = import("../generated/prisma/client.ts").then(
  ({ PrismaClient }) =>
    new PrismaClient({
      adapter: new PrismaPg({
        connectionString: prismaConfig.datasource.url,
      }),
    }),
);

exports.getAllVehicles = async (req, res) => {
  try {
    const prisma = await prismaPromise;

    // 1. Pagination
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

    const skip = (page - 1) * limit;

    // 2. Filtering
    const where = {};

    if (req.query.brand) {
      where.brand = {
        contains: req.query.brand,
        mode: "insensitive",
      };
    }

    if (req.query.model) {
      where.model = {
        contains: req.query.model,
        mode: "insensitive",
      };
    }

    if (req.query.fuelType) {
      where.fuelType = req.query.fuelType;
    }

    if (req.query.region) {
      where.region = {
        contains: req.query.region,
        mode: "insensitive",
      };
    }

    if (req.query.isActive !== undefined) {
      if (["true", "false"].includes(req.query.isActive)) {
        where.isActive = req.query.isActive === "true";
      } else {
        return res.status(400).json({
          status: "error",
          message: "isActive must be true or false",
        });
      }
    }

    // 3. Searching
    if (req.query.search) {
      const search = req.query.search.trim();

      where.OR = [
        {
          plateNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          brand: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          model: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          region: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // 4. Sorting
    const allowedSortFields = [
      "createdAt",
      "plateNumber",
      "brand",
      "model",
      "tankCapacity",
      "expectedConsumption",
    ];

    const sortBy = allowedSortFields.includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";

    const order = req.query.order === "asc" ? "asc" : "desc";

    // 5. Get total count and vehicles
    const [totalVehicles, vehicles] = await Promise.all([
      prisma.vehicles.count({ where }),

      prisma.vehicles.findMany({
        where,
        orderBy: {
          [sortBy]: order,
        },
        skip,
        take: limit,
      }),
    ]);

    // Pagination metadata
    const totalPages = Math.ceil(totalVehicles / limit);

    return res.status(200).json({
      status: "success",
      count: vehicles.length,
      totalVehicles,
      pagination: {
        currentPage: page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      data: vehicles,
    });
  } catch (error) {
    console.error("Get vehicles error:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve vehicles",
    });
  }
};
// get vehicle by ID
exports.getVehicleById = async (req, res) => {
  try {
    const prisma = await prismaPromise;
    const vehicleId = req.params.id;
    console.log("Vehicle ID:", vehicleId);

    if (!vehicleId) {
      return res.status(400).json({
        status: "error",
        message: "Vehicle ID does not exist!..",
      });
    }
    const vehicle = await prisma.vehicles.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return res.status(404).json({
        status: "error",
        message: "Vehicle not found!..",
      });
    }
    return res.status(200).json({
      status: "success",
      data: vehicle,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve vehicle..!",
    });
  }
};
//update vehicle by ID
exports.updateVehicle = async (req, res) => {
  try {
    const prisma = await prismaPromise;

    const { id } = req.params;

    // 1. Validate ID
    if (!id) {
      return res.status(400).json({
        status: "error",
        message: "Vehicle ID is required",
      });
    }

    // 2. Check if vehicle exists
    const vehicle = await prisma.vehicles.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return res.status(404).json({
        status: "error",
        message: "Vehicle not found",
      });
    }

    // 3. Update vehicle
    const updatedVehicle = await prisma.vehicles.update({
      where: { id },
      data: req.body,
    });

    // 4. Send response
    return res.status(200).json({
      status: "success",
      message: "Vehicle updated successfully",
      data: updatedVehicle,
    });
  } catch (error) {
    console.error("Update vehicle error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        status: "error",
        message: "Plate number already exists",
      });
    }

    if (error.code === "P2003") {
      return res.status(400).json({
        status: "error",
        message: "Invalid related record reference",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Failed to update vehicle",
    });
  }
};
// create vehicle by ID
exports.createVehicle = async (req, res) => {
  try {
    const prisma = await prismaPromise;

    const newVehicle = await prisma.vehicles.create({
      data: {
        plateNumber: req.body.plateNumber,
        brand: req.body.brand,
        model: req.body.model,
        departmentId: req.body.departmentId,
        fuelType: req.body.fuelType,
        tankCapacity: req.body.tankCapacity,
        expectedConsumption: req.body.expectedConsumption,
        isActive: req.body.isActive ?? true,
        region: req.body.region,
        liveTrackUrl: req.body.liveTrackUrl,
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Vehicle created successfully",
      data: newVehicle,
    });
  } catch (error) {
    console.error("Create vehicle error:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to create vehicle",
    });
  }
};
//delete vehicle by ID
exports.deleteVehicle = async (req, res) => {
  try {
    const prisma = await prismaPromise;

    const { id } = req.params;

    await prisma.vehicles.delete({
      where: {
        id: id,
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Delete vehicle error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        status: "error",
        message: "Vehicle not found",
      });
    }

    if (error.code === "P2003") {
      return res.status(409).json({
        status: "error",
        message: "Cannot delete vehicle because it has related records",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Failed to delete vehicle",
    });
  }
};
