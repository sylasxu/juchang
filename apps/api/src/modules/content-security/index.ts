/**
 * Content Security Module - 统一内容安全模块
 * 
 * 导出统一的内容审核接口
 */

export {
    validateContent,
    validateFields,
    type ValidationContext,
    type ValidationResult,
} from './content-security.service';

export {
    getAccessToken,
    msgSecCheck,
    clearTokenCache,
    type ContentCheckResult,
} from './wechat-api.client';
