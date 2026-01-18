/**
 * Grading utility for Nepal's CDC (Curriculum Development Centre) standards.
 * Supports SEE (Grade 10) and NEB (Grade 11/12) calculations.
 */

export interface GradeMap {
  grade: string;
  gpa: number;
  description: string;
}

export const CDC_GRADING_2078: Record<string, GradeMap> = {
  "90-100": { grade: "A+", gpa: 4.0, description: "Outstanding" },
  "80-89":  { grade: "A",  gpa: 3.6, description: "Excellent" },
  "70-79":  { grade: "B+", gpa: 3.2, description: "Very Good" },
  "60-69":  { grade: "B",  gpa: 2.8, description: "Good" },
  "50-59":  { grade: "C+", gpa: 2.4, description: "Satisfactory" },
  "40-49":  { grade: "C",  gpa: 2.0, description: "Acceptable" },
  "35-39":  { grade: "D",  gpa: 1.6, description: "Basic" },
  "0-34":   { grade: "NG", gpa: 0.0, description: "Non-Graded" },
};

export function getGradeFromPercentage(percentage: number): GradeMap {
  if (percentage >= 90) return CDC_GRADING_2078["90-100"];
  if (percentage >= 80) return CDC_GRADING_2078["80-89"];
  if (percentage >= 70) return CDC_GRADING_2078["70-79"];
  if (percentage >= 60) return CDC_GRADING_2078["60-69"];
  if (percentage >= 50) return CDC_GRADING_2078["50-59"];
  if (percentage >= 40) return CDC_GRADING_2078["40-49"];
  if (percentage >= 35) return CDC_GRADING_2078["35-39"];
  return CDC_GRADING_2078["0-34"];
}

export function calculateGPA(subjectGrades: number[]): number {
  if (subjectGrades.length === 0) return 0;

  // If any subject is NG, the final GPA is often marked as NG or 0 in Nepal's SEE/NEB
  if (subjectGrades.some(g => g === 0)) return 0;

  const totalPoints = subjectGrades.reduce((acc, curr) => acc + curr, 0);
  return parseFloat((totalPoints / subjectGrades.length).toFixed(2));
}
