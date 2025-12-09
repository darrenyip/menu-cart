<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑原料' : '新增原料'"
    width="560px"
    @close="handleClose"
    class="material-edit-dialog"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="80px"
      label-position="left"
    >
      <el-form-item label="原料名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入原料名称" size="large" clearable />
      </el-form-item>

      <el-divider>
        <el-icon><ShoppingCart /></el-icon>
        <span>采购信息</span>
      </el-divider>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="采购单位" prop="purchase_unit">
            <el-select v-model="form.purchase_unit" placeholder="选择单位" filterable allow-create style="width: 100%">
              <el-option label="斤" value="斤" />
              <el-option label="公斤" value="公斤" />
              <el-option label="个" value="个" />
              <el-option label="只" value="只" />
              <el-option label="瓶" value="瓶" />
              <el-option label="袋" value="袋" />
              <el-option label="包" value="包" />
              <el-option label="盒" value="盒" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="采购单价" prop="purchase_price">
            <el-input-number
              v-model="form.purchase_price"
              :min="0"
              :precision="2"
              :step="0.5"
              placeholder="0.00"
              style="width: 100%"
              controls-position="right"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="供应商">
        <el-select 
          v-model="form.supplier" 
          placeholder="选择常用供应商" 
          filterable 
          allow-create
          clearable
          style="width: 100%"
        >
          <el-option 
            v-for="s in supplierOptions" 
            :key="s" 
            :label="s" 
            :value="s" 
          />
        </el-select>
      </el-form-item>

      <el-divider>
        <el-icon><ScaleToOriginal /></el-icon>
        <span>单位换算</span>
      </el-divider>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="基础单位" prop="base_unit">
            <el-select v-model="form.base_unit" placeholder="配菜单位" style="width: 100%">
              <el-option-group label="重量">
                <el-option label="克" value="克" />
                <el-option label="千克" value="千克" />
              </el-option-group>
              <el-option-group label="数量">
                <el-option label="个" value="个" />
                <el-option label="只" value="只" />
                <el-option label="根" value="根" />
                <el-option label="片" value="片" />
              </el-option-group>
              <el-option-group label="容量">
                <el-option label="毫升" value="毫升" />
                <el-option label="升" value="升" />
              </el-option-group>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="换算比例" prop="conversion_rate">
            <el-input-number
              v-model="form.conversion_rate"
              :min="0"
              :precision="0"
              placeholder="如: 500"
              style="width: 100%"
              controls-position="right"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <div class="conversion-preview" v-if="form.purchase_unit && form.base_unit && form.conversion_rate">
        <el-icon><InfoFilled /></el-icon>
        <span>换算关系：1 {{ form.purchase_unit }} = {{ form.conversion_rate }} {{ form.base_unit }}</span>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">
        {{ isEdit ? '保存修改' : '确认添加' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
import { ShoppingCart, ScaleToOriginal, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import materialsApi from '@/api/materials'

// 默认表单数据
const getDefaultForm = () => ({
  name: '',
  purchase_unit: '斤',
  purchase_price: 0,
  supplier: '',
  base_unit: '克',
  conversion_rate: 500,
})

export default {
  name: 'MaterialEditDialog',
  components: {
    ShoppingCart,
    ScaleToOriginal,
    InfoFilled,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    // 编辑时传入的原料数据，新增时为 null
    material: {
      type: Object,
      default: null,
    },
    // 供应商选项
    supplierOptions: {
      type: Array,
      default: () => ['乐禾', '快驴', '超市'],
    },
  },
  emits: ['update:modelValue', 'saved'],
  data() {
    return {
      saving: false,
      form: getDefaultForm(),
      formRules: {
        name: [
          { required: true, message: '请输入原料名称', trigger: 'blur' },
          { min: 1, max: 50, message: '名称长度在 1 到 50 个字符', trigger: 'blur' },
        ],
        purchase_unit: [
          { required: true, message: '请选择采购单位', trigger: 'change' },
        ],
        base_unit: [
          { required: true, message: '请选择基础单位', trigger: 'change' },
        ],
      },
    }
  },
  computed: {
    visible: {
      get() {
        return this.modelValue
      },
      set(val) {
        this.$emit('update:modelValue', val)
      },
    },
    isEdit() {
      return !!this.material?.id
    },
  },
  watch: {
    modelValue(val) {
      if (val) {
        this.initForm()
      }
    },
  },
  methods: {
    initForm() {
      if (this.material) {
        // 编辑模式：填充原料数据
        this.form = {
          name: this.material.name || '',
          purchase_unit: this.material.purchase_unit || this.material.unit || '斤',
          purchase_price: this.material.purchase_price || this.material.price || 0,
          supplier: this.material.supplier || '',
          base_unit: this.material.base_unit || '克',
          conversion_rate: this.material.conversion_rate || 500,
        }
      } else {
        // 新增模式：重置表单
        this.form = getDefaultForm()
      }
    },

    handleClose() {
      this.$refs.formRef?.resetFields()
      this.visible = false
    },

    async handleSave() {
      try {
        await this.$refs.formRef.validate()
      } catch {
        return
      }

      this.saving = true
      try {
        const data = {
          name: this.form.name.trim(),
          purchase_unit: this.form.purchase_unit || '斤',
          purchase_price: this.form.purchase_price || 0,
          supplier: this.form.supplier || '',
          base_unit: this.form.base_unit || '克',
          conversion_rate: this.form.conversion_rate || 500,
          // 兼容旧字段
          unit: this.form.base_unit || '克',
          price: this.form.purchase_price || 0,
        }

        if (this.isEdit) {
          await materialsApi.update(this.material.id, data)
          ElMessage.success('原料修改成功！')
        } else {
          await materialsApi.create(data)
          ElMessage.success('原料添加成功！')
        }

        this.handleClose()
        this.$emit('saved')
      } catch (error) {
        console.error('保存原料失败:', error)
        ElMessage.error('保存失败，请重试')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>

<style scoped>
.material-edit-dialog :deep(.el-dialog__header) {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.material-edit-dialog :deep(.el-divider__text) {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
}

.conversion-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%);
  border-radius: 8px;
  color: #10b981;
  font-size: 14px;
  font-weight: 500;
}

/* 响应式 */
@media (max-width: 768px) {
  .material-edit-dialog :deep(.el-dialog) {
    width: 92% !important;
    max-width: 520px;
    margin: 5vh auto !important;
  }

  .material-edit-dialog :deep(.el-dialog__body) {
    padding: 16px 20px;
  }

  .material-edit-dialog :deep(.el-col-12) {
    max-width: 100%;
    flex: 0 0 100%;
  }
}

@media (max-width: 576px) {
  .material-edit-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 3vh auto !important;
    border-radius: 12px;
  }

  .material-edit-dialog :deep(.el-dialog__header) {
    padding: 14px 16px 12px;
  }

  .material-edit-dialog :deep(.el-dialog__title) {
    font-size: 16px;
  }

  .material-edit-dialog :deep(.el-dialog__body) {
    padding: 12px 16px;
  }

  .material-edit-dialog :deep(.el-dialog__footer) {
    padding: 12px 16px 16px;
  }

  .material-edit-dialog :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  .material-edit-dialog :deep(.el-form-item__label) {
    font-size: 13px;
    padding-bottom: 4px;
  }

  .material-edit-dialog :deep(.el-divider) {
    margin: 16px 0;
  }

  .material-edit-dialog :deep(.el-divider__text) {
    font-size: 12px;
    padding: 0 8px;
  }

  .conversion-preview {
    padding: 10px 12px;
    font-size: 13px;
    border-radius: 6px;
  }

  .material-edit-dialog :deep(.el-dialog__footer .el-button) {
    padding: 10px 16px;
    font-size: 14px;
  }
}

@media (max-width: 400px) {
  .material-edit-dialog :deep(.el-dialog) {
    width: 98% !important;
    margin: 2vh auto !important;
  }

  .material-edit-dialog :deep(.el-dialog__header) {
    padding: 12px 14px 10px;
  }

  .material-edit-dialog :deep(.el-dialog__body) {
    padding: 10px 14px;
  }

  .material-edit-dialog :deep(.el-dialog__footer) {
    padding: 10px 14px 14px;
  }

  .material-edit-dialog :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  .conversion-preview {
    padding: 8px 10px;
    font-size: 12px;
    gap: 6px;
  }

  .material-edit-dialog :deep(.el-dialog__footer .el-button) {
    padding: 8px 14px;
    font-size: 13px;
  }
}
</style>

