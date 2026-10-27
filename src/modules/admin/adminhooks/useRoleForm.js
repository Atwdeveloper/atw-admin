"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "@/lib/navigation";
import Swal from "sweetalert2";
import {
  createRoleAPI,
  getPermissionCatalogAPI,
  getRoleAPI,
  updateRoleAPI,
} from "../../../api/adminV1/roleAPI";
import { catalogToModules } from "../../../api/adminV1/permissions";
import { apiError } from "../../../api/javaApi";
import { useAdminPermissions } from "../../../common/hooks/useAdminPermissions";

export const useRoleForm = (isEdit = false) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { refresh: refreshMyPermissions } = useAdminPermissions();

  const [loading, setLoading] = useState(false);
  // [{ module, module_label, actions: [{ action, label }] }]
  const [permissionsData, setPermissionsData] = useState([]);
  // { "module.action": boolean } — the keys are the backend's permission codes
  const [selectedPermissions, setSelectedPermissions] = useState({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  // System roles can't be edited on the backend.
  const [isSystemRole, setIsSystemRole] = useState(false);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Track initial form state for dirty checking
  const initialFormStateRef = useRef(null);
  const initialPermissionsRef = useRef(null);
  // Track if we're navigating after successful save
  const isSavingRef = useRef(false);

  useEffect(() => {
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isEdit && id && permissionsData.length > 0) {
      fetchRoleData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id, permissionsData]);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const modules = catalogToModules(await getPermissionCatalogAPI());
      setPermissionsData(modules);

      // Initialize selected permissions object
      const initialSelected = {};
      modules.forEach((module) => {
        module.actions.forEach((action) => {
          initialSelected[`${module.module}.${action.action}`] = false;
        });
      });
      setSelectedPermissions(initialSelected);

      // Store initial permissions state for dirty checking (for add mode)
      if (!isEdit && !initialPermissionsRef.current) {
        initialPermissionsRef.current = { ...initialSelected };
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: apiError(error, "Failed to load permissions. Please try again.").message,
      });
    }

    if (isEdit === false) {
      setIsLoading(false);
    }
  };

  const fetchRoleData = async () => {
    setIsLoading(true);
    try {
      const roleData = await getRoleAPI(id);

      const newFormData = {
        title: roleData.name || "",
        description: roleData.description || "",
      };
      setFormData(newFormData);
      setIsSystemRole(Boolean(roleData.systemRole));

      // Store initial form state for dirty checking
      initialFormStateRef.current = { ...newFormData };

      const updatedSelected = { ...selectedPermissions };
      (roleData.permissionCodes || []).forEach((code) => {
        updatedSelected[code] = true;
      });
      setSelectedPermissions(updatedSelected);

      // Store initial permissions state for dirty checking
      initialPermissionsRef.current = { ...updatedSelected };
    } catch (error) {
      console.error("Error fetching role data:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: apiError(error, "Failed to load role data. Please try again.").message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if form is dirty
  const isFormDirty = () => {
    // Don't check if we're in the process of saving
    if (isSavingRef.current) {
      return false;
    }

    const isFormDataDirty = initialFormStateRef.current
      ? JSON.stringify(formData) !== JSON.stringify(initialFormStateRef.current)
      : formData.title !== "" || formData.description !== "";

    const isPermissionsDirty = initialPermissionsRef.current
      ? JSON.stringify(selectedPermissions) !== JSON.stringify(initialPermissionsRef.current)
      : Object.values(selectedPermissions).some((value) => value === true);

    return isFormDataDirty || isPermissionsDirty;
  };

  // Reset form to initial state
  const resetForm = () => {
    if (isEdit && initialFormStateRef.current) {
      setFormData({ ...initialFormStateRef.current });
      setSelectedPermissions({ ...initialPermissionsRef.current });
    } else {
      setFormData({ title: "", description: "" });
      const resetPermissions = { ...selectedPermissions };
      Object.keys(resetPermissions).forEach((key) => {
        resetPermissions[key] = false;
      });
      setSelectedPermissions(resetPermissions);
    }
    setErrors({});
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Handle permission selection
  const handlePermissionChange = (permissionKey, checked) => {
    setSelectedPermissions((prev) => ({ ...prev, [permissionKey]: checked }));
    setErrors((prev) => ({ ...prev, permissions: null }));
  };

  // Handle module permission selection (select all actions in a module)
  const handleModuleSelect = (module, checked) => {
    const updatedSelected = { ...selectedPermissions };
    module.actions.forEach((action) => {
      updatedSelected[`${module.module}.${action.action}`] = checked;
    });
    setSelectedPermissions(updatedSelected);
    setErrors((prev) => ({ ...prev, permissions: null }));
  };

  const getSelectedCodes = () =>
    Object.keys(selectedPermissions).filter((key) => selectedPermissions[key]);

  const getSelectedPermissionsCount = () => getSelectedCodes().length;

  // "Module - Action" labels for the summary panel
  const getSelectedPermissionsForDisplay = () =>
    getSelectedCodes().map((key) => {
      const [module, action] = key.split(".");
      const moduleData = permissionsData.find((m) => m.module === module);
      const actionData = moduleData?.actions.find((a) => a.action === action);
      return moduleData && actionData ? `${moduleData.module_label} - ${actionData.label}` : key;
    });

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Role title is required";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Role title must be at least 3 characters";
    } else if (formData.title.trim().length > 100) {
      newErrors.title = "Role title must be at most 100 characters";
    }

    if (formData.description.trim().length > 300) {
      newErrors.description = "Description must be at most 300 characters";
    }

    if (getSelectedPermissionsCount() === 0) {
      newErrors.permissions = "Please select at least one permission";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        name: formData.title.trim(),
        description: formData.description.trim() || null,
        permissionCodes: getSelectedCodes(),
      };

      if (isEdit) {
        await updateRoleAPI(id, submitData);
        // The admin may hold this role — keep the sidebar and page guards in step.
        refreshMyPermissions();
      } else {
        await createRoleAPI(submitData);
      }

      // Set saving flag to prevent unsaved changes warning
      isSavingRef.current = true;
      initialFormStateRef.current = { ...formData };
      initialPermissionsRef.current = { ...selectedPermissions };

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: `Role has been ${isEdit ? "updated" : "created"} successfully.`,
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        navigate("/admin/roles");
      });
    } catch (error) {
      // 409: duplicate name. 422: system role, or granting a permission the
      // current admin doesn't hold. 400: validation / unknown permission code.
      const { code, message, fieldErrors } = apiError(
        error,
        `Could not ${isEdit ? "update" : "create"} role. Please try again.`,
      );
      if (code === "CONFLICT") {
        setErrors((prev) => ({ ...prev, title: "A role with this name already exists" }));
      } else if (fieldErrors.name || fieldErrors.description) {
        setErrors((prev) => ({
          ...prev,
          title: fieldErrors.name,
          description: fieldErrors.description,
        }));
      }
      Swal.fire({
        icon: "error",
        title: "Error",
        text: code === "CONFLICT" ? "A role with this name already exists." : message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Count selected permissions for a module
  const countModuleSelected = (module) =>
    module.actions.filter((action) => selectedPermissions[`${module.module}.${action.action}`])
      .length;

  // Check if all permissions in a module are selected
  const isModuleAllSelected = (module) =>
    module.actions.every((action) => selectedPermissions[`${module.module}.${action.action}`]);

  // Check if any permission in a module is selected
  const isModuleAnySelected = (module) =>
    module.actions.some((action) => selectedPermissions[`${module.module}.${action.action}`]);

  // Select all permissions
  const handleSelectAll = (checked) => {
    const updatedSelected = { ...selectedPermissions };
    Object.keys(updatedSelected).forEach((key) => {
      updatedSelected[key] = checked;
    });
    setSelectedPermissions(updatedSelected);
    setErrors((prev) => ({ ...prev, permissions: null }));
  };

  return {
    formData,
    errors,
    loading,
    isLoading,
    permissionsData,
    selectedPermissions,
    setFormData,
    handleInputChange,
    handlePermissionChange,
    handleModuleSelect,
    handleSubmit,
    getSelectedPermissionsForBackend: getSelectedCodes,
    getSelectedPermissionsForDisplay,
    getSelectedPermissionsCount,
    countModuleSelected,
    isModuleAllSelected,
    isModuleAnySelected,
    handleSelectAll,
    isFormDirty: isFormDirty(), // Return the computed value
    resetForm,
    isSystemRole,
  };
};
