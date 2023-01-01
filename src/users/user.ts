export interface User {
  id: number;
  email: string;
  name: string;
  status?: "Happy" | "Sad" | "In the zone";
  phoneNumbers: string[];
  /**
   * @minimum 5
   */
  length?: number;
}
