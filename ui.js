import {
  getSchoolLevels,
  getCoursesBySchoolLevel,
  getFilteredCourses,
  getSelectedStandards
} from "./data.js";

export function populateSchoolLevelOptions() {
  const schoolLevelSelect = document.getElementById("schoolLevelSelect");
  if (!schoolLevelSelect) return;

  const levels = getSchoolLevels();

  schoolLevelSelect.innerHTML = `<option value="">전체</option>`;
  levels.forEach(level => {
    const option = document.createElement("option");
    option.value = level;
    option.textContent = level;
    schoolLevelSelect.appendChild(option);
  });
}

export function populateCourseOptions(selectedSchoolLevel = "") {
  const courseSelect = document.getElementById("courseSelect");
  if (!courseSelect) return;

  const courses = getCoursesBySchoolLevel(selectedSchoolLevel);

  courseSelect.innerHTML = `<option value="">전체</option>`;
  courses.forEach(course => {
    const option = document.createElement("option");
    option.value = course;
    option.textContent = course;
    courseSelect.appendChild(option);
  });
}

export function renderCurriculum({ schoolLevel = "", course = "" } = {}) {
  const curriculumArea = document.getElementById("curriculumArea");
  if (!curriculumArea) return;

  curriculumArea.innerHTML = "";

  const filteredCourses = getFilteredCourses({ schoolLevel, course });

  if (filteredCourses.length === 0) {
    curriculumArea.innerHTML = `<p>표시할 성취기준이 없습니다.</p>`;
    return;
  }

  filteredCourses.forEach(courseObj => {
    const courseBlock = document.createElement("div");
    courseBlock.className = "course-block";

    const courseTitle = document.createElement("h3");
    courseTitle.textContent = `${courseObj.school_level} · ${courseObj.course}`;
    courseBlock.appendChild(courseTitle);

    courseObj.units.forEach(unitObj => {
      const unitBlock = document.createElement("div");
      unitBlock.className = "unit-block";

      const unitTitle = document.createElement("div");
      unitTitle.className = "unit-title";
      unitTitle.textContent = unitObj.unit;
      unitBlock.appendChild(unitTitle);

      unitObj.standards.forEach(std => {
        const label = document.createElement("label");
        label.className = "standard-label";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "standard-checkbox";
        checkbox.value = std.achievement_code;
        checkbox.dataset.code = std.achievement_code;
        checkbox.dataset.text = std.achievement_text;
        checkbox.dataset.display = std.display_text;
        checkbox.dataset.course = courseObj.course;
        checkbox.dataset.schoolLevel = courseObj.school_level;
        checkbox.dataset.unit = unitObj.unit;

        checkbox.addEventListener("change", updateSelectedStandardsPreview);

        label.appendChild(checkbox);
        label.append(` ${std.display_text}`);

        unitBlock.appendChild(label);
      });

      courseBlock.appendChild(unitBlock);
    });

    curriculumArea.appendChild(courseBlock);
  });

  updateSelectedStandardsPreview();
}

export function bindCurriculumFilterEvents() {
  const schoolLevelSelect = document.getElementById("schoolLevelSelect");
  const courseSelect = document.getElementById("courseSelect");

  if (schoolLevelSelect) {
    schoolLevelSelect.addEventListener("change", () => {
      populateCourseOptions(schoolLevelSelect.value);
      renderCurriculum({
        schoolLevel: schoolLevelSelect.value,
        course: ""
      });
    });
  }

  if (courseSelect) {
    courseSelect.addEventListener("change", () => {
      renderCurriculum({
        schoolLevel: schoolLevelSelect?.value || "",
        course: courseSelect.value
      });
    });
  }
}

export function updateSelectedStandardsPreview() {
  const preview = document.getElementById("selectedStandardsPreview");
  if (!preview) return;

  const selected = getSelectedStandards();

  if (selected.length === 0) {
    preview.textContent = "아직 선택된 성취기준이 없습니다.";
    return;
  }

  preview.innerHTML = selected
    .map(item => `<div class="selected-standard-item">${item.display_text}</div>`)
    .join("");
}