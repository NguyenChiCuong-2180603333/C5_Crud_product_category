var express = require('express');
const { ConnectionCheckOutFailedEvent } = require('mongodb');
var router = express.Router();
let categoryModel = require('../schemas/category')

// Thêm hàm buildQuery bị thiếu
function buildQuery(obj){
  let result = {};
  if(obj.name){
    result.name = new RegExp(obj.name,'i');
  }
  // Chỉ trả về danh mục chưa bị xóa mềm
  result.isDeleted = { $ne: true };
  return result;
}

/* GET users listing. */
router.get('/', async function(req, res, next) {
  try {
    let categories = await categoryModel.find(buildQuery(req.query));
    res.status(200).send({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});

router.get('/:id', async function(req, res, next) {
  try {
    let id = req.params.id;
    let category = await categoryModel.findOne({ _id: id, isDeleted: { $ne: true } });
    
    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Không tìm thấy danh mục hoặc đã bị xóa"
      });
    }
    
    res.status(200).send({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(404).send({
      success: false,
      message: "Không có id phù hợp"
    });
  }
});

router.post('/', async function(req, res, next) {
  try {
    let newCategory = new categoryModel({
      name: req.body.name,
      description: req.body.description,
      isDeleted: false // Thêm trường isDeleted khi tạo danh mục mới
    })
    await newCategory.save();
    res.status(200).send({
      success: true,
      data: newCategory
    });
  } catch (error) {
    res.status(404).send({
      success: false,
      message: error.message
    });
  }
});

// Hàm PUT để cập nhật danh mục
router.put('/:id', async function(req, res, next) {
  try {
    let id = req.params.id;
    
    // Kiểm tra xem danh mục có tồn tại và chưa bị xóa không
    let existingCategory = await categoryModel.findOne({ _id: id, isDeleted: { $ne: true } });
    
    if (!existingCategory) {
      return res.status(404).send({
        success: false,
        message: "Không tìm thấy danh mục hoặc đã bị xóa"
      });
    }
    
    // Cập nhật thông tin danh mục
    let updatedCategory = await categoryModel.findByIdAndUpdate(
      id,
      {
        name: req.body.name || existingCategory.name,
        description: req.body.description || existingCategory.description
      },
      { new: true } // Trả về document đã được cập nhật
    );
    
    res.status(200).send({
      success: true,
      data: updatedCategory,
      message: "Cập nhật danh mục thành công"
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});

// Hàm DELETE để xóa mềm danh mục
router.delete('/:id', async function(req, res, next) {
  try {
    let id = req.params.id;
    
    // Kiểm tra xem danh mục có tồn tại và chưa bị xóa không
    let existingCategory = await categoryModel.findOne({ _id: id, isDeleted: { $ne: true } });
    
    if (!existingCategory) {
      return res.status(404).send({
        success: false,
        message: "Không tìm thấy danh mục hoặc đã bị xóa"
      });
    }
    
    // Thực hiện xóa mềm bằng cách cập nhật trường isDeleted
    let deletedCategory = await categoryModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    
    res.status(200).send({
      success: true,
      message: "Xóa danh mục thành công",
      data: deletedCategory
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;