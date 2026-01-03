import instituteRepository from "../repository/instituteRepository";

export class InstituteService {
  async getInstituteById(id: string) {
    const institute = await instituteRepository.findById(id);
    if (!institute) throw new Error("Institute not found");
    return institute;
  }

  async getInstituteDetails(id: string) {
    const details = await instituteRepository.findWithStats(id);
    if (!details) throw new Error("Institute not found");
    return details;
  }

  async updateInstitute(id: string, data: any) {
    return instituteRepository.update(id, data);
  }
}

export default new InstituteService();
