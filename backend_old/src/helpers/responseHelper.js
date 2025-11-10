// responseHelper.js
/**
 * Trả về response thành công
 */
function success(res, message, data) {
  return res.status(200).json({ success: true, message, data });
}

/**
 * Trả về response lỗi
 */
function error(res, message, err, status = 500) {
  return res.status(status).json({ success: false, message, error: err?.message || err });
}

module.exports = { success, error };
