const express = require('express');
const multer = require('multer');
const router = express.Router();
const { ProductModel } = require('./db');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // Specify the directory to store uploads
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); // Specify the filename
    },
  });

const upload = multer({ storage: storage });



// Create a new product
router.post('/', upload.single('image'), async (req, res) => {
    try {
      const { name, price, description, category, attributes } = req.body;
  
      const newProduct = new ProductModel({
        name,
        price,
        description,
        category,
        attributes: JSON.parse(attributes), // Parse JSON string
        image: req.file.filename, // Store the filename in the database
      });
  
      await newProduct.save();
  
      res.status(201).json({ message: 'Product created successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to create the product' });
    }
  });

// Get a list of all products
router.get('/', async (req, res) => {
  try {
    const products = await ProductModel.find();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Get a single product by ID
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await ProductModel.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch the product' });
  }
});

// Update a product by ID
router.put('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, price, description, category, attributes } = req.body;

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      productId,
      {
        name,
        price,
        description,
        category,
        attributes,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update the product' });
  }
});

// Delete a product by ID
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const deletedProduct = await ProductModel.findByIdAndRemove(productId);

    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete the product' });
  }
});

module.exports = router;
