import { RootState } from '@/store';

export const selectStudents = (state: RootState) => state.students.students;
export const selectDepartments = (state: RootState) => state.students.departments || [];
export const selectBatches = (state: RootState) => state.students.batches || [];
export const selectSemesters = (state: RootState) => state.students.semesters || [];
export const selectCurrentStudent = (state: RootState) => state.students.currentStudent;
export const selectLoading = (state: RootState) => state.students.loading;
export const selectSubmitting = (state: RootState) => state.students.submitting;
export const selectError = (state: RootState) => state.students.error;
export const selectSuccessMessage = (state: RootState) => state.students.successMessage;
export const selectTotalCount = (state: RootState) => state.students.totalCount;
export const selectPage = (state: RootState) => state.students.page;
export const selectLimit = (state: RootState) => state.students.limit;
export const selectSearchQuery = (state: RootState) => state.students.searchQuery;
export const selectFilters = (state: RootState) => state.students.filters;

export const selectDepartmentOptions = (state: RootState) => {
  const departments = selectDepartments(state);
  
  if (!Array.isArray(departments)) {
    console.error("Departments is not an array:", departments);
    return [];
  }
  
  return departments
    .map(dept => ({
      value: dept.department_id?.toString() || '',
      label: dept.department_name || 'Unknown Department',
    }))
    .filter(option => option.value && option.label);
};

export const selectBatchOptions = (state: RootState) => {
  const batches = selectBatches(state);
  
  if (!Array.isArray(batches)) {
    console.error("Batches is not an array:", batches);
    return [];
  }
  
  return batches
    .map(batch => ({
      value: batch.batch_id?.toString() || '',
      label: batch.batch_year || 'Unknown Batch',
    }))
    .filter(option => option.value && option.label);
};

export const selectSemesterOptions = (state: RootState) => {
  const semesters = selectSemesters(state);
  
  if (!Array.isArray(semesters)) {
    console.error("Semesters is not an array:", semesters);
    return [];
  }
  
  return semesters
    .map(semester => ({
      value: semester.id?.toString() || '',
      label: semester.semester || 'Unknown Semester',
    }))
    .filter(option => option.value && option.label);
};

export const selectAdmissionYearOptions = (state: RootState) => {
  const admissionYears = state.batches?.admissionYears || [];
  const seen = new Set<string>();
  const options: { value: string; label: string }[] = [];

  for (const item of admissionYears) {
    const yearStr = item?.year?.toString().trim();
    if (yearStr && !seen.has(yearStr)) {
      seen.add(yearStr);
      options.push({
        value: yearStr,
        label: item.description ? `${yearStr} (${item.description})` : yearStr,
      });
    }
  }

  return options;
};

export const selectFilteredStudents = (state: RootState) => {
  const { students, filters, searchQuery } = state.students;
  
  if (!Array.isArray(students)) {
    return [];
  }
  
  return students.filter(student => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      (student.full_name && student.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (student.student_number && student.student_number.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Department filter
    const matchesDepartment = filters.department === '' || 
      (student.department_id && student.department_id.toString() === filters.department);
    
    // Batch filter
    const matchesBatch = filters.batch === '' || 
      (student.batch_id && student.batch_id.toString() === filters.batch);

    // Admission Year filter
    const matchesAdmissionYear = !filters.admission_year || 
      (student.admission_year && student.admission_year.toString() === filters.admission_year);
    
    // Semester filter
    const matchesSemester = filters.semester === '' || 
      (student.semester_id && student.semester_id.toString() === filters.semester);
    
    // Status filter
    const matchesStatus = filters.status === '' || 
      student.status === filters.status;
    
    return matchesSearch && matchesDepartment && matchesBatch && matchesAdmissionYear && matchesSemester && matchesStatus;
  });
};