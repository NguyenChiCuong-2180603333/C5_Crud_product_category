var express = require('express');
const { ConnectionCheckOutFailedEvent } = require('mongodb');
var router = express.Router();
let productModel = require('../schemas/product')
function buildQuery(obj){
  console.log(obj);
  let result = {};
  if(obj.name){
    result.name=new RegExp(obj.name,'i');
  }
  result.price = {};
  if(obj.price){
    if(obj.price.$gte){
      result.price.$gte = obj.price.$gte;
    }else{
      result.price.$gte = 0
    }
    if(obj.price.$lte){
      result.price.$lte = obj.price.$lte;
    }else{
      result.price.$lte = 10000;
    }
    
  }
  // Chỉ trả về sản phẩm chưa bị xóa mềm
  result.isDeleted = { $ne: true };
  return result;
}
/* GET users listing. */
router.get('/', async function(req, res, next) {
  
  let products = await productModel.find(buildQuery(req.query));
  res.status(200).send({
    success:true,
    data:products
  });
});
router.get('/:id', async function(req, res, next) {
  try {
    let id = req.params.id;
    let product = await productModel.findOne({ _id: id, isDeleted: { $ne: true } });
    
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Không tìm thấy sản phẩm hoặc đã bị xóa"
      });
    }
    
    res.status(200).send({
      success:true,
      data:product
    });
  } catch (error) {
    res.status(404).send({
      success:false,
      message:"khong co id phu hop"
    });
  }
});
router.post('/', async function(req, res, next) {
  try {
    let newProduct = new productModel({
      name: req.body.name,
      price:req.body.price,
      quantity: req.body.quantity,
      category:req.body.category,
      isDeleted: false // Thêm trường isDeleted khi tạo sản phẩm mới
    })
    await newProduct.save();
    res.status(200).send({
      success:true,
      data:newProduct
    });
  } catch (error) {
    res.status(404).send({
      success:false,
      message:error.message
    });
  }
});

// Thêm hàm PUT để cập nhật sản phẩm
router.put('/:id', async function(req, res, next) {
  try {
    let id = req.params.id;
    
    // Kiểm tra xem sản phẩm có tồn tại và chưa bị xóa không
    let existingProduct = await productModel.findOne({ _id: id, isDeleted: { $ne: true } });
    
    if (!existingProduct) {
      return res.status(404).send({
        success: false,
        message: "Không tìm thấy sản phẩm hoặc đã bị xóa"
      });
    }
    
    // Cập nhật thông tin sản phẩm
    let updatedProduct = await productModel.findByIdAndUpdate(
      id,
      {
        name: req.body.name || existingProduct.name,
        price: req.body.price || existingProduct.price,
        quantity: req.body.quantity || existingProduct.quantity,
        category: req.body.category || existingProduct.category
      },
      { new: true } // Trả về document đã được cập nhật
    );
    
    res.status(200).send({
      success: true,
      data: updatedProduct,
      message: "Cập nhật sản phẩm thành công"
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});

// Thêm hàm DELETE để xóa mềm sản phẩm
router.delete('/:id', async function(req, res, next) {
  try {
    let id = req.params.id;
    
    // Kiểm tra xem sản phẩm có tồn tại và chưa bị xóa không
    let existingProduct = await productModel.findOne({ _id: id, isDeleted: { $ne: true } });
    
    if (!existingProduct) {
      return res.status(404).send({
        success: false,
        message: "Không tìm thấy sản phẩm hoặc đã bị xóa"
      });
    }
    
    // Thực hiện xóa mềm bằng cách cập nhật trường isDeleted
    let deletedProduct = await productModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    
    res.status(200).send({
      success: true,
      message: "Xóa sản phẩm thành công",
      data: deletedProduct
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;