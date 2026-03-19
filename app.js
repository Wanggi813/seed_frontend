const appState = {
  schoolLevel: "중학교",
  subject: "1학년 과학",
  classType: "2차시",
  equipment: "제한적임",
  goal: "지역문제 해결 중심",
  level: "표준형",
  selectedIssue: "dust",
  selectedDataset: "school",
  mySchoolId: "A001",
  aiLessonPlan: null,
  aiOutputs: null,
};





function getMySchool() {
  return realLikeData.schools.find((school) => school.schoolId === appState.mySchoolId);
}

function getNeighborSchools() {
  const mySchool = getMySchool();
  if (!mySchool) return [];
  return realLikeData.schools.filter((school) => school.district === mySchool.district);
}

function populateSubjectSelect() {
  const select = document.getElementById("subject");
  const options = subjectOptions[appState.schoolLevel] || [];
  select.innerHTML = "";
  options.forEach((subject, index) => {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = subject;
    if (index === 0) option.selected = true;
    select.appendChild(option);
  });
  appState.subject = options[0] || "";
}

function populateSchoolSelect() {
  const select = document.getElementById("my-school");
  select.innerHTML = "";
  realLikeData.schools
    .filter((school) => {
      if (appState.schoolLevel === "중학교") return school.level === "중학교";
      return school.level === "중학교"; // 현재 데이터가 중학교만 있으므로 유지
    })
    .forEach((school, index) => {
      const option = document.createElement("option");
      option.value = school.schoolId;
      option.textContent = `${school.name} (${school.district})`;
      if (index === 0) {
        option.selected = true;
        appState.mySchoolId = school.schoolId;
      }
      select.appendChild(option);
    });
}

function renderDatasetTabs() {
  const wrap = document.getElementById("dataset-tabs");
  wrap.innerHTML = "";
  ["school", "trend", "env", "calendar"].forEach((key) => {
    const btn = document.createElement("button");
    btn.className = `dataset-tab ${appState.selectedDataset === key ? "active" : ""}`;
    btn.textContent = datasetLabels[key];
    btn.dataset.dataset = key;
    btn.addEventListener("click", () => {
      appState.selectedDataset = key;
      renderDatasetTabs();
      renderIssueData();
    });
    wrap.appendChild(btn);
  });
}

function updateStateFromForm() {
  appState.schoolLevel = document.getElementById("school-level").value;
  appState.subject = document.getElementById("subject").value;
  appState.mySchoolId = document.getElementById("my-school").value;
  appState.classType = document.getElementById("class-type").value;
  appState.equipment = document.getElementById("equipment").value;
  appState.goal = document.getElementById("goal").value;
  appState.level = document.getElementById("level").value;
}

function renderSummary(targetId) {
  const target = document.getElementById(targetId);
  const mySchool = getMySchool();
  target.innerHTML = `
    <strong>선택한 조건</strong><br>
    학교급: ${appState.schoolLevel} · 과목: ${appState.subject} · 수업 형태: ${appState.classType}<br>
    기자재 환경: ${appState.equipment} · 수업 목표: ${appState.goal} · 학생 참여 수준: ${appState.level}<br>
    우리 학교: ${mySchool ? `${mySchool.name} (${mySchool.district})` : "-"}
  `;
}

function getDatasetChartTitle() {
  const mySchool = getMySchool();
  const schoolName = mySchool ? mySchool.name : "우리 학교";
  const district = mySchool ? mySchool.district : "생활권";

  const titles = {
    school: `${schoolName}와 주변 학교 현황 비교`,
    trend: `${district} 학생 수 변화 추이`,
    env: `${district} 월별 PM2.5 변화`,
    calendar: `${schoolName} 및 주변 학교 학사일정 예시`
  };
  return titles[appState.selectedDataset];
}

function getDatasetInsight() {
  const mySchool = getMySchool();
  const district = mySchool ? mySchool.district : "생활권";

  if (appState.selectedDataset === "school") {
    const neighbors = getNeighborSchools();
    const maxSchool = [...neighbors].sort((a, b) => b.students - a.students)[0];
    return `${district}에서는 ${maxSchool.name}의 학생 수가 가장 많아 학교 규모 차이를 비교하기 좋습니다.`;
  }
  if (appState.selectedDataset === "trend") {
    const rows = realLikeData.educationStats.filter((r) => r.district === district);
    const diff = rows[rows.length - 1].middleStudents - rows[0].middleStudents;
    return `${district}의 최근 학생 수 변화는 ${diff > 0 ? "+" : ""}${diff}명입니다.`;
  }
  if (appState.selectedDataset === "env") {
    const rows = realLikeData.airQuality.filter((r) => r.district === district);
    const avg = Math.round(rows.reduce((s, r) => s + r.pm25, 0) / rows.length);
    return `${district}의 평균 PM2.5 값은 ${avg}입니다.`;
  }
  const events = realLikeData.schoolCalendar.filter((r) => getNeighborSchools().some((s) => s.schoolId === r.schoolId));
  return `주변 학교 기준 학사일정 예시 ${events.length}건을 수업 적용 시기 판단에 활용할 수 있습니다.`;
}

function getDatasetChartData() {
  const mySchool = getMySchool();
  const district = mySchool?.district;

  if (appState.selectedDataset === "school") {
    return getNeighborSchools().map((s) => ({ label: s.name, value: s.students }));
  }

  if (appState.selectedDataset === "trend") {
    return realLikeData.educationStats
      .filter((row) => row.district === district)
      .map((row) => ({ label: String(row.year), value: row.middleStudents }));
  }

  if (appState.selectedDataset === "env") {
    return realLikeData.airQuality
      .filter((row) => row.district === district)
      .map((row) => ({ label: row.month, value: row.pm25 }));
  }

  if (appState.selectedDataset === "calendar") {
    const events = realLikeData.schoolCalendar.filter((row) =>
      getNeighborSchools().some((s) => s.schoolId === row.schoolId)
    );
    return events.map((row, idx) => ({
      label: row.eventName.length > 4 ? row.eventName.slice(0, 4) + "…" : row.eventName,
      value: idx + 1
    }));
  }

  return [];
}

function buildLessonPlanPrompt() {
  const mySchool = getMySchool();
  const issue = getIssueContent();
  const datasetName = datasetLabels[appState.selectedDataset];
  const chartInsight = getDatasetInsight();
  const neighbors = getNeighborSchools();

  return `
당신은 한국 중등 교사를 위한 탐구수업 설계 전문가이다.

[수업 조건]
학교급: ${appState.schoolLevel}
과목: ${appState.subject}
수업 형태: ${appState.classType}
기자재 환경: ${appState.equipment}
수업 목표: ${appState.goal}
학생 참여 수준: ${appState.level}

[학교 정보]
우리 학교: ${mySchool ? mySchool.name : "-"}
생활권: ${mySchool ? mySchool.district : "-"}
비교 가능한 주변 학교 수: ${neighbors.length}개교

[선택한 지역문제]
주제: ${issue.title}

[선택한 데이터]
데이터 유형: ${datasetName}
데이터 해석 포인트: ${chartInsight}

다음을 JSON으로만 출력하라.
{
  "mainQuestion": "문자열",
  "subQuestions": ["문자열", "문자열", "문자열"],
  "lessonGoals": ["문자열", "문자열", "문자열"],
  "lessonFlow": [
    { "title": "문자열", "text": "문자열" },
    { "title": "문자열", "text": "문자열" }
  ]
}
`;
}

function buildOutputsPrompt() {
  const lesson = appState.aiLessonPlan;
  const issue = getIssueContent();
  const mySchool = getMySchool();

  return `
당신은 한국 중등 교사를 위한 수업자료 생성 전문가이다.

[기본 정보]
학교급: ${appState.schoolLevel}
과목: ${appState.subject}
우리 학교: ${mySchool ? mySchool.name : "-"}
지역문제: ${issue.title}
활용 자료: ${datasetLabels[appState.selectedDataset]}

[이미 생성된 수업안]
핵심 탐구 질문: ${lesson?.mainQuestion || ""}
하위 질문: ${(lesson?.subQuestions || []).join(" | ")}
수업 목표: ${(lesson?.lessonGoals || []).join(" | ")}
수업 흐름: ${(lesson?.lessonFlow || [])
      .map((x) => `${x.title}: ${x.text}`)
      .join(" | ")}

다음을 JSON으로만 출력하라.
{
  "worksheet": ["문항1", "문항2", "문항3", "문항4"],
  "rubric": [
    ["평가요소", "상", "중", "하"],
    ["평가요소", "상", "중", "하"],
    ["평가요소", "상", "중", "하"]
  ],
  "slides": ["슬라이드1", "슬라이드2", "슬라이드3", "슬라이드4", "슬라이드5"]
}
`;
}

function getIssueContent() {
  const mySchool = getMySchool();
  const district = mySchool ? mySchool.district : "생활권";
  const schoolName = mySchool ? mySchool.name : "우리 학교";

  return {
    dust: {
      title: "미세먼지",
      dataRecommendations: [
        { name: "학교 현황 데이터", text: `${schoolName}와 주변 학교의 학생 수·과학실 수를 비교합니다.` },
        { name: "생활권 학생 수 데이터", text: `${district}의 학생 수 변화를 참고해 생활 환경 맥락을 해석합니다.` },
        { name: "생활권 환경 데이터", text: `${district}의 월별 PM2.5 변화를 바탕으로 지역문제를 탐구합니다.` }
      ],
      previewQuestions: [
        `${schoolName}가 속한 ${district}의 미세먼지 변화는 학생 생활 환경과 어떤 관계가 있을까?`,
        `우리 학교와 주변 학교의 탐구 환경 차이는 어떤 특징을 보일까?`,
        `학생이 실천할 수 있는 지역 환경 개선 방안은 무엇일까?`
      ],
      mainQuestion: `${schoolName}가 속한 ${district}의 미세먼지 변화는 학생의 생활 환경과 어떤 관계가 있을까?`,
      subQuestions: [
        `${district}의 월별 미세먼지 농도는 어떻게 달라지는가?`,
        `${schoolName}와 주변 학교의 규모 및 과학실 수 차이는 탐구 활동 운영에 어떤 영향을 줄 수 있는가?`,
        `학생이 실천할 수 있는 해결 방안은 무엇인가?`
      ],
      lessonGoals: [
        "우리 학교가 속한 지역 데이터를 활용해 환경 문제를 과학적으로 해석할 수 있다.",
        "우리 학교와 주변 학교의 탐구 조건 차이를 비교할 수 있다.",
        "문제 해결 방안을 논리적으로 제시할 수 있다."
      ],
      lessonFlow: [
        {
          title: "1차시 · 우리 학교와 생활권 데이터 이해",
          text: `${district}의 PM2.5 데이터와 ${schoolName} 및 주변 학교 데이터를 바탕으로 탐구 질문과 가설을 설정한다.`
        },
        {
          title: "2차시 · 비교 분석과 해결 방안 제안",
          text: `생활권 환경 데이터와 학교 비교 데이터를 해석한 뒤 해결 방안을 발표한다.`
        }
      ]
    },

    safety: {
      title: "통학 안전",
      dataRecommendations: [
        { name: "학교 현황 데이터", text: `${schoolName}와 주변 학교의 학생 수를 비교해 통학 혼잡 가능성을 추론합니다.` },
        { name: "생활권 학생 수 데이터", text: `${district}의 학생 수 변화를 통해 통학 환경 변화를 해석합니다.` },
        { name: "학사일정 데이터", text: `프로젝트 수업이나 안전 캠페인 적용 시점을 구상합니다.` }
      ],
      previewQuestions: [
        `${schoolName}와 주변 학교 중 학생 수가 많은 학교는 어디일까?`,
        `${district}의 학생 수 변화는 통학 환경과 어떤 관련이 있을까?`,
        `학생이 제안할 수 있는 안전 개선 방안은 무엇일까?`
      ],
      mainQuestion: `${schoolName}와 주변 학교의 규모는 통학 안전 문제와 어떤 관련이 있을까?`,
      subQuestions: [
        `학생 수가 많은 학교에서는 어떤 통학 안전 문제가 예상되는가?`,
        `${district}의 학생 수 변화는 통학 혼잡과 어떤 관련이 있을까?`,
        `학생이 제안할 수 있는 실천적 개선 방안은 무엇인가?`
      ],
      lessonGoals: [
        "우리 학교와 주변 학교 규모를 기반으로 통학 안전 문제를 분석할 수 있다.",
        "지역 데이터를 바탕으로 실생활 문제를 합리적으로 해석할 수 있다.",
        "학생 관점에서 개선 방안을 제안할 수 있다."
      ],
      lessonFlow: [
        {
          title: "1차시 · 우리 학교와 주변 학교 비교",
          text: `${schoolName}와 주변 학교의 학생 수를 비교하여 통학 혼잡 가능성을 예측한다.`
        },
        {
          title: "2차시 · 생활권 학생 수 변화와 연결",
          text: `${district}의 학생 수 추이를 해석하여 통학 문제와 연결하고 개선 방안을 설계한다.`
        }
      ]
    },

    students: {
      title: "학생 수 변화",
      dataRecommendations: [
        { name: "생활권 학생 수 데이터", text: `${district}의 최근 학생 수 변화를 확인합니다.` },
        { name: "학교 현황 데이터", text: `${schoolName}와 주변 학교의 규모·과학실 수를 함께 비교합니다.` },
        { name: "학사일정 데이터", text: `프로젝트 적용 가능 시기를 함께 고려합니다.` }
      ],
      previewQuestions: [
        `${district}의 학생 수 변화는 어떤 추세를 보일까?`,
        `${schoolName}와 주변 학교의 환경 차이는 어떤 특징을 보일까?`,
        `학생 수 변화에 대응하기 위한 방안은 무엇일까?`
      ],
      mainQuestion: `${district}의 학생 수 변화는 학교 교육환경과 어떤 관계가 있을까?`,
      subQuestions: [
        `${district}의 최근 학생 수 변화는 어떻게 나타나는가?`,
        `${schoolName}와 주변 학교의 규모 및 과학실 수 차이는 어떤 특징을 보이는가?`,
        `지역 교육환경을 유지하거나 개선하기 위한 방안은 무엇인가?`
      ],
      lessonGoals: [
        "생활권 학생 수 변화 추이를 데이터로 해석할 수 있다.",
        "우리 학교와 주변 학교 환경 차이를 설명할 수 있다.",
        "교육 문제 해결 방안을 제안할 수 있다."
      ],
      lessonFlow: [
        {
          title: "1차시 · 생활권 학생 수 추세 읽기",
          text: `${district}의 학생 수 변화를 비교하며 핵심 질문을 만든다.`
        },
        {
          title: "2차시 · 주변 학교 환경과 연결",
          text: `${schoolName}와 주변 학교의 규모 및 과학실 수를 참고해 교육환경 변화를 분석한다.`
        }
      ]
    },

    energy: {
      title: "에너지 사용",
      dataRecommendations: [
        { name: "학교 현황 데이터", text: `${schoolName}와 주변 학교의 학생 수·교실 수·시설 수를 참고합니다.` },
        { name: "학사일정 데이터", text: `에너지 절약 캠페인 적용 시기를 구상합니다.` },
        { name: "생활권 학생 수 데이터", text: `${district}의 학교 운영 규모를 이해하는 보조 자료로 활용합니다.` }
      ],
      previewQuestions: [
        `${schoolName}와 주변 학교 중 에너지 사용이 많을 것으로 예상되는 곳은 어디일까?`,
        `과학실·컴퓨터실 수는 에너지 사용 추론에 어떤 도움이 될까?`,
        `학생이 실천할 수 있는 에너지 절감 방안은 무엇일까?`
      ],
      mainQuestion: `${schoolName}와 주변 학교의 규모와 시설 수는 에너지 사용 문제와 어떤 관계가 있을까?`,
      subQuestions: [
        `학생 수와 교실 수가 많은 학교는 어떤 에너지 사용 특성을 가질까?`,
        `과학실과 컴퓨터실 수는 어떤 근거가 될 수 있는가?`,
        `학생이 실천할 수 있는 절감 방안은 무엇인가?`
      ],
      lessonGoals: [
        "우리 학교와 주변 학교 자료를 바탕으로 에너지 사용 문제를 추론할 수 있다.",
        "생활 속 과학 문제를 해결 중심으로 탐구할 수 있다.",
        "실천 가능한 절감 방안을 제안할 수 있다."
      ],
      lessonFlow: [
        {
          title: "1차시 · 학교 시설 비교",
          text: `${schoolName}와 주변 학교의 학생 수, 교실 수, 시설 수를 바탕으로 에너지 사용 요인을 정리한다.`
        },
        {
          title: "2차시 · 절감 방안 설계",
          text: `에너지 사용 가능성이 높은 학교 환경을 분석하고 학생 실천 방안을 설계한다.`
        }
      ]
    },

    green: {
      title: "녹지 환경",
      dataRecommendations: [
        { name: "생활권 환경 데이터", text: `${district}의 환경 특성을 해석합니다.` },
        { name: "학교 현황 데이터", text: `${schoolName}와 주변 학교의 분포 및 규모를 함께 비교합니다.` },
        { name: "생활권 학생 수 데이터", text: `생활 환경의 질과 교육 수요를 함께 해석합니다.` }
      ],
      previewQuestions: [
        `${schoolName}가 속한 ${district}의 환경은 어떤 특징을 보일까?`,
        `주변 학교 규모와 생활권 특성을 함께 보면 어떤 차이를 찾을 수 있을까?`,
        `학생이 제안할 수 있는 생활 환경 개선 방안은 무엇일까?`
      ],
      mainQuestion: `${district}의 환경은 학생의 생활 환경과 어떤 관계가 있을까?`,
      subQuestions: [
        `${district}의 환경 자료는 어떤 특징을 보이는가?`,
        `${schoolName}와 주변 학교의 규모 차이는 생활 환경 탐구에 어떤 단서를 주는가?`,
        `학생이 제안할 수 있는 개선 방안은 무엇인가?`
      ],
      lessonGoals: [
        "생활 환경과 지역 환경의 관계를 해석할 수 있다.",
        "우리 학교와 주변 학교 데이터를 연결해 과학적 탐구를 수행할 수 있다.",
        "생활 환경 개선 방안을 제안할 수 있다."
      ],
      lessonFlow: [
        {
          title: "1차시 · 생활권 환경 비교",
          text: `${district}의 학생 수와 환경 자료를 확인하며 환경 특성을 탐색한다.`
        },
        {
          title: "2차시 · 개선 방안 제안",
          text: `환경 특성이 학생 생활에 미치는 영향을 분석하고 학교 주변 개선 방안을 제안한다.`
        }
      ]
    }
  }[appState.selectedIssue];
}

function renderSchoolDataTable() {
  const mySchool = getMySchool();
  const neighbors = getNeighborSchools();
  const table = document.getElementById("school-data-table");
  const desc = document.getElementById("school-panel-desc");

  desc.textContent = mySchool
    ? `${mySchool.name}이(가) 속한 ${mySchool.district}의 주변 학교 데이터를 비교합니다.`
    : "주변 학교 데이터를 비교합니다.";

  table.innerHTML = `
    <thead>
      <tr>
        <th>선택</th>
        <th>학교명</th>
        <th>생활권</th>
        <th>학생 수</th>
        <th>교원 수</th>
        <th>과학실 수</th>
        <th>컴퓨터실 수</th>
        <th>설립연도</th>
      </tr>
    </thead>
    <tbody>
      ${neighbors.map((school) => `
        <tr class="${school.schoolId === appState.mySchoolId ? "school-row-highlight" : ""}">
          <td>${school.schoolId === appState.mySchoolId ? "★" : ""}</td>
          <td>${school.name}</td>
          <td>${school.district}</td>
          <td>${school.students}</td>
          <td>${school.teachers}</td>
          <td>${school.scienceLabs}</td>
          <td>${school.computerLabs}</td>
          <td>${school.yearFounded}</td>
        </tr>
      `).join("")}
    </tbody>
  `;
}

function renderIssueData() {
  const content = getIssueContent();
  const dataBox = document.getElementById("data-recommendations");
  const questionList = document.getElementById("question-preview-list");
  const insight = document.getElementById("preview-insight");
  const chartTitle = document.getElementById("preview-chart-title");

  dataBox.innerHTML = "";
  questionList.innerHTML = "";

  content.dataRecommendations.forEach((item) => {
    const card = document.createElement("div");
    card.style.marginBottom = "12px";
    card.innerHTML = `
      <strong>${item.name}</strong>
      <p style="margin:6px 0 0; color:var(--sub);">${item.text}</p>
    `;
    dataBox.appendChild(card);
  });

  content.previewQuestions.forEach((q) => {
    const li = document.createElement("li");
    li.textContent = q;
    questionList.appendChild(li);
  });

  chartTitle.textContent = getDatasetChartTitle();
  renderSimpleChart("simple-chart", getDatasetChartData());
  insight.textContent = getDatasetInsight();
  renderSchoolDataTable();
}

function renderLessonPlan() {
  const content = appState.aiLessonPlan || getIssueContent();
  const mySchool = getMySchool();
  const neighbors = getNeighborSchools();

  renderSummary("design-summary");

  document.getElementById("design-summary").innerHTML += `
    <br><br>
    <strong>연결된 데이터 기반</strong><br>
    우리 학교: ${mySchool ? mySchool.name : "-"} · 비교 학교 수: ${neighbors.length}개교 · 선택 자료: ${datasetLabels[appState.selectedDataset]}
  `;

  document.getElementById("main-question").textContent = content.mainQuestion;

  const subQuestions = document.getElementById("sub-questions");
  const lessonGoals = document.getElementById("lesson-goals");
  const lessonFlow = document.getElementById("lesson-flow");

  subQuestions.innerHTML = "";
  lessonGoals.innerHTML = "";
  lessonFlow.innerHTML = "";

  content.subQuestions.forEach((q) => {
    const li = document.createElement("li");
    li.textContent = q;
    subQuestions.appendChild(li);
  });

  content.lessonGoals.forEach((goal) => {
    const li = document.createElement("li");
    li.textContent = goal;
    lessonGoals.appendChild(li);
  });

  content.lessonFlow.forEach((flow) => {
    const div = document.createElement("div");
    div.className = "timeline-item";
    div.innerHTML = `<h4>${flow.title}</h4><p>${flow.text}</p>`;
    lessonFlow.appendChild(div);
  });

  renderPromptModalContent();
}

function renderOutputs() {
  const lesson = appState.aiLessonPlan || getIssueContent();
  const output = appState.aiOutputs;
  const mySchool = getMySchool();

  const worksheetItems = output?.worksheet || lesson.subQuestions || [];
  const rubricRows = output?.rubric || [
    ["데이터 해석", "우리 학교와 지역 자료를 근거 있게 연결해 해석함", "기본 경향을 해석함", "자료 해석이 부분적임"],
    ["문제 분석", "지역문제와 학교 환경의 관계를 논리적으로 설명함", "기본적 관계를 설명함", "분석이 단편적임"],
    ["해결 방안", "구체적이고 실행 가능한 제안을 함", "일반적 제안을 함", "구체성이 부족함"]
  ];
  const slides = output?.slides || [
    `문제 제기: ${lesson.title || getIssueContent().title}`,
    "우리 학교 및 주변 학교 비교",
    datasetLabels[appState.selectedDataset],
    "탐구 결과 정리",
    "실천 방안 제안"
  ];

  document.getElementById("worksheet-content").innerHTML = `
    <h3>학생 활동지</h3>
    <p><strong>우리 학교:</strong> ${mySchool ? mySchool.name : "-"}</p>
    <p><strong>핵심 질문:</strong> ${lesson.mainQuestion}</p>
    <p><strong>활용 자료:</strong> ${datasetLabels[appState.selectedDataset]}</p>
    <ol class="ordered-list">
      ${worksheetItems.map((item) => `<li>${item}</li>`).join("")}
    </ol>
  `;

  document.getElementById("rubric-table").innerHTML = `
    <thead>
      <tr><th>평가 요소</th><th>상</th><th>중</th><th>하</th></tr>
    </thead>
    <tbody>
      ${rubricRows
        .map(
          (row) => `
        <tr>
          <td>${row[0]}</td>
          <td>${row[1]}</td>
          <td>${row[2]}</td>
          <td>${row[3]}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  `;

  document.getElementById("slides-outline").innerHTML =
    slides.map((item) => `<li>${item}</li>`).join("");

  renderSimpleChart("final-chart", getDatasetChartData());
  document.getElementById("final-insight").textContent =
    "선택한 학교와 생활권 데이터를 바탕으로 AI가 생성한 수업 자료입니다.";
}

function renderPromptModalContent() {
  const mySchool = getMySchool();
  const content = getIssueContent();

  document.getElementById("prompt-step-1-meta").innerHTML = `
    학교급: ${appState.schoolLevel} / 과목: ${appState.subject} / 우리 학교: ${mySchool ? mySchool.name : "-"} / 자료: ${datasetLabels[appState.selectedDataset]}
  `;
  document.getElementById("prompt-step-1").textContent =
    `다음 조건을 반영하여 ${appState.schoolLevel} ${appState.subject} 수준의 탐구 질문을 생성하시오.
우리 학교는 "${mySchool ? mySchool.name : "-"}"이며 선택 자료는 "${datasetLabels[appState.selectedDataset]}"이다.
학생이 실제 데이터를 비교·해석할 수 있도록 개방형 질문으로 구성하시오.`;

  document.getElementById("prompt-step-2-meta").innerHTML = `
    수업 형태: ${appState.classType} / 기자재 환경: ${appState.equipment}
  `;
  document.getElementById("prompt-step-2").textContent =
    `위 탐구 질문을 바탕으로 ${appState.classType} 수업 구조를 설계하시오.
우리 학교와 주변 학교 데이터를 비교하는 활동을 반드시 포함하고,
기자재가 "${appState.equipment}"인 학교 환경에서도 실행 가능해야 한다.`;

  document.getElementById("prompt-step-3-meta").innerHTML = `
    생성 대상: 학생 활동지 / 평가 루브릭 / 발표자료 초안
  `;
  document.getElementById("prompt-step-3").textContent =
    `위 수업 구조를 바탕으로 학생 활동지와 평가 루브릭 초안을 작성하시오.
선택 자료 "${datasetLabels[appState.selectedDataset]}"를 활용한 해석 활동이 드러나도록 구성하시오.
교사가 바로 수정·활용할 수 있는 간결한 형식으로 제시하시오.`;
}

function toggleSchoolDataPanel() {
  const panel = document.getElementById("school-data-panel");
  const btn = document.getElementById("toggle-school-data-btn");
  const isHidden = panel.style.display === "none" || panel.style.display === "";
  panel.style.display = isHidden ? "block" : "none";
  btn.textContent = isHidden ? "학교 데이터 숨기기" : "학교 데이터 보기";
}

function bindEvents() {
  document.getElementById("school-level").addEventListener("change", (e) => {
    appState.schoolLevel = e.target.value;
    populateSubjectSelect();
    populateSchoolSelect();
  });

  document.getElementById("start-design-btn").addEventListener("click", () => {
    updateStateFromForm();
    renderSummary("input-summary");
    renderDatasetTabs();
    renderIssueData();
    showScreen(2);
  });

  document.getElementById("toggle-school-data-btn").addEventListener("click", toggleSchoolDataPanel);

  document.querySelectorAll(".issue-card").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".issue-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      appState.selectedIssue = card.dataset.issue;
      renderIssueData();
    });
  });

  document.getElementById("generate-plan-btn").addEventListener("click", async () => {
  try {
    const btn = document.getElementById("generate-plan-btn");
    btn.disabled = true;
    btn.textContent = "AI 수업안 생성 중...";

    const prompt = buildLessonPlanPrompt();
    const result = await callLessonAPI(prompt, "plan");

    appState.aiLessonPlan = result;
    renderLessonPlan();
    showScreen(3);
  } catch (err) {
    alert("수업안 생성 중 오류가 발생했습니다: " + err.message);
  } finally {
    const btn = document.getElementById("generate-plan-btn");
    btn.disabled = false;
    btn.textContent = "이 주제로 수업 설계하기";
  }
});

document.getElementById("generate-output-btn").addEventListener("click", async () => {
  try {
    const btn = document.getElementById("generate-output-btn");
    btn.disabled = true;
    btn.textContent = "산출물 생성 중...";

    if (!appState.aiLessonPlan) {
      throw new Error("먼저 AI 수업안을 생성해야 합니다.");
    }

    const prompt = buildOutputsPrompt();
    const result = await callLessonAPI(prompt, "output");

    appState.aiOutputs = result;
    renderOutputs();
    showScreen(4);
  } catch (err) {
    alert("산출물 생성 중 오류가 발생했습니다: " + err.message);
  } finally {
    const btn = document.getElementById("generate-output-btn");
    btn.disabled = false;
    btn.textContent = "수업 산출물 생성";
  }
});

  document.getElementById("open-ai-modal-btn").addEventListener("click", openModal);
  document.getElementById("close-ai-modal-btn").addEventListener("click", closeModal);
  document.getElementById("close-modal-overlay").addEventListener("click", closeModal);

  document.querySelectorAll("[data-prev]").forEach((btn) => {
    btn.addEventListener("click", () => showScreen(Number(btn.dataset.prev)));
  });

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  document.getElementById("restart-btn").addEventListener("click", () => showScreen(1));
  document.getElementById("save-pdf-btn").addEventListener("click", () => window.print());
}

function renderDatasetTabs() {
  const wrap = document.getElementById("dataset-tabs");
  wrap.innerHTML = "";
  ["school", "trend", "env", "calendar"].forEach((key) => {
    const btn = document.createElement("button");
    btn.className = `dataset-tab ${appState.selectedDataset === key ? "active" : ""}`;
    btn.textContent = datasetLabels[key];
    btn.addEventListener("click", () => {
      appState.selectedDataset = key;
      renderDatasetTabs();
      renderIssueData();
    });
    wrap.appendChild(btn);
  });
}

function init() {
  populateSubjectSelect();
  populateSchoolSelect();
  renderDatasetTabs();
  renderIssueData();
  renderSchoolDataTable();
  bindEvents();
}

const API_BASE =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://seed-backend-xso7.onrender.com";

async function callLessonAPI(prompt, mode = "plan") {
  const res = await fetch(`${API_BASE}/api/generate`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ prompt, mode })
});

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "AI 요청 실패");
  }

  return await res.json();
}

init();