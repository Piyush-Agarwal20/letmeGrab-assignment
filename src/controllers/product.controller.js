const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response.util');
const { normalizeProductName, formatProductName } = require('../utils/string.util');


const addProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock } = req.body;
    const sellerId = req.seller.id;

    // Normalize product name (lowercase, trimmed)
    const normalizedName = normalizeProductName(name);

    // Check if product with same name already exists for this seller
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: normalizedName,
        sellerId,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    if (existingProduct) {
      const displayName = formatProductName(existingProduct.name);
      if (existingProduct.isActive) {
        return sendError(
          res,
          409,
          `Product "${displayName}" already exists. Please update the existing product or use a different name`
        );
      } else {
        return sendError(
          res,
          409,
          `Product "${displayName}" already exists but is inactive. Please reactivate it by updating the product instead`
        );
      }
    }

    // Create product with normalized name
    const product = await prisma.product.create({
      data: {
        name: normalizedName,
        description,
        price,
        stock,
        sellerId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        isActive: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            shopName: true,
          },
        },
      },
    });

    // Format product name for display
    const formattedProduct = {
      ...product,
      name: formatProductName(product.name),
    };

    return sendSuccess(res, 201, 'Product added successfully', { product: formattedProduct });
  } catch (error) {
    next(error);
  }
};


const getMyProducts = async (req, res, next) => {
  try {
    const sellerId = req.seller.id;

    const products = await prisma.product.findMany({
      where: {
        sellerId,
        isActive: true, // Only get active products
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format product names for display
    const formattedProducts = products.map(product => ({
      ...product,
      name: formatProductName(product.name),
    }));

    return sendSuccess(res, 200, 'Products retrieved successfully', {
      products: formattedProducts,
      count: formattedProducts.length,
    });
  } catch (error) {
    next(error);
  }
};


const getProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const sellerId = req.seller.id;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        seller: {
          select: {
            id: true,
            shopName: true,
          },
        },
      },
    });

    if (!product) {
      return sendError(res, 404, 'Product not found or you do not have access to this product');
    }

    // Format product name for display
    const formattedProduct = {
      ...product,
      name: formatProductName(product.name),
    };

    return sendSuccess(res, 200, 'Product retrieved successfully', { product: formattedProduct });
  } catch (error) {
    next(error);
  }
};


const updateProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const sellerId = req.seller.id;
    const updateData = req.body;

    // Check if product exists and belongs to seller
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId,
      },
    });

    if (!existingProduct) {
      return sendError(res, 404, 'Product not found or you do not have access to this product');
    }

    // Normalize product name if it's being updated
    if (updateData?.name) {
      updateData.name = normalizeProductName(updateData.name);

      // Check if another product with the same name exists
      const duplicateProduct = await prisma.product.findFirst({
        where: {
          name: updateData.name,
          sellerId,
          id: { not: productId }, // Exclude current product
        },
      });

      if (duplicateProduct) {
        const displayName = formatProductName(duplicateProduct.name);
        return sendError(
          res,
          409,
          `Another product with name "${displayName}" already exists. Please use a different name`
        );
      }
    }

    console.log('Update Data:', updateData);

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Format product name for display
    const formattedProduct = {
      ...updatedProduct,
      name: formatProductName(updatedProduct.name),
    };

    return sendSuccess(res, 200, 'Product updated successfully', { product: formattedProduct });
  } catch (error) {
    next(error);
  }
};


const updateStock = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { stock } = req.body;
    const sellerId = req.seller.id;

    // Check if product exists and belongs to seller
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId,
      },
    });

    if (!existingProduct) {
      return sendError(res, 404, 'Product not found or you do not have access to this product');
    }

    // Update stock
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { stock },
      select: {
        id: true,
        name: true,
        stock: true,
        updatedAt: true,
      },
    });

    // Format product name for display
    const formattedProduct = {
      ...updatedProduct,
      name: formatProductName(updatedProduct.name),
    };

    return sendSuccess(res, 200, 'Stock updated successfully', { product: formattedProduct });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const sellerId = req.seller.id;

    // Check if product exists and belongs to seller
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId,
      },
    });

    if (!existingProduct) {
      return sendError(res, 404, 'Product not found or you do not have access to this product');
    }

    // Soft delete by setting isActive to false
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    return sendSuccess(res, 200, 'Product deleted successfully', null);
  } catch (error) {
    next(error);
  }
};


const getAllProducts = async (req, res, next) => {
  try {
    const {
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Convert to numbers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Validate pagination params
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return sendError(res, 400, 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 100');
    }

    // Build where clause
    const where = {
      isActive: true,
    };

    // Add search filter if provided
    if (search) {
      const normalizedSearch = normalizeProductName(search);
      where.OR = [
        { name: { contains: normalizedSearch } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Validate sort field
    const allowedSortFields = ['createdAt', 'price', 'name'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    // Get total count for pagination
    const totalCount = await prisma.product.count({ where });

    // Fetch products with pagination
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            shopName: true,
          },
        },
      },
      orderBy: {
        [sortField]: sortDirection,
      },
      skip,
      take: limitNum,
    });

    // Format product names for display
    const formattedProducts = products.map(product => ({
      ...product,
      name: formatProductName(product.name),
    }));

    return sendSuccess(res, 200, 'Products retrieved successfully', {
      products: formattedProducts,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
        hasNext: pageNum < Math.ceil(totalCount / limitNum),
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};


const getProductById = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            shopName: true,
          },
        },
      },
    });

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    // Format product name for display
    const formattedProduct = {
      ...product,
      name: formatProductName(product.name),
    };

    return sendSuccess(res, 200, 'Product retrieved successfully', { product: formattedProduct });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addProduct,
  getMyProducts,
  getProduct,
  updateProduct,
  updateStock,
  deleteProduct,
  getAllProducts,
  getProductById,
};