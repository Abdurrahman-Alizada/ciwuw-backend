declare module "cloudinary" {
  export const v2: {
    config(options: {
      cloud_name: string;
      api_key: string;
      api_secret: string;
    }): void;
    uploader: {
      upload(file: string, options?: any): Promise<any>;
      destroy(public_id: string, options?: any): Promise<any>;
    };
  };
}
