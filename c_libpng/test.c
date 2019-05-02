#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <stdarg.h>
#include <stdint.h>
#include <math.h>

#define PNG_DEBUG 3
#include <png.h>

void abort_(const char *s, ...)
{
        va_list args;
        va_start(args, s);
        vfprintf(stderr, s, args);
        fprintf(stderr, "\n");
        va_end(args);
        abort();
}

int x, y;

int width, height;
png_byte color_type;
png_byte bit_depth;

png_structp png_ptr;
png_infop info_ptr;
int number_of_passes;
png_bytep *row_pointers;
png_bytep *out_pointers;

void read_png_file(char *file_name)
{
        char header[8]; // 8 is the maximum size that can be checked

        /* open file and test for it being a png */
        FILE *fp = fopen(file_name, "rb");
        if (!fp)
                abort_("[read_png_file] File %s could not be opened for reading", file_name);
        fread(header, 1, 8, fp);
        if (png_sig_cmp(header, 0, 8))
                abort_("[read_png_file] File %s is not recognized as a PNG file", file_name);

        /* initialize stuff */
        png_ptr = png_create_read_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);

        if (!png_ptr)
                abort_("[read_png_file] png_create_read_struct failed");

        info_ptr = png_create_info_struct(png_ptr);
        if (!info_ptr)
                abort_("[read_png_file] png_create_info_struct failed");

        if (setjmp(png_jmpbuf(png_ptr)))
                abort_("[read_png_file] Error during init_io");

        png_init_io(png_ptr, fp);
        png_set_sig_bytes(png_ptr, 8);

        png_read_info(png_ptr, info_ptr);

        width = png_get_image_width(png_ptr, info_ptr);
        height = png_get_image_height(png_ptr, info_ptr);
        color_type = png_get_color_type(png_ptr, info_ptr);
        bit_depth = png_get_bit_depth(png_ptr, info_ptr);

        number_of_passes = png_set_interlace_handling(png_ptr);
        png_read_update_info(png_ptr, info_ptr);

        /* read file */
        if (setjmp(png_jmpbuf(png_ptr)))
                abort_("[read_png_file] Error during read_image");

        row_pointers = (png_bytep *)malloc(sizeof(png_bytep) * height);
        for (y = 0; y < height; y++)
                row_pointers[y] = (png_byte *)malloc(png_get_rowbytes(png_ptr, info_ptr));

        png_read_image(png_ptr, row_pointers);

        fclose(fp);
}

void write_png_file(char *file_name)
{
        /* create file */
        FILE *fp = fopen(file_name, "wb");
        if (!fp)
                abort_("[write_png_file] File %s could not be opened for writing", file_name);

        /* initialize stuff */
        png_ptr = png_create_write_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);

        if (!png_ptr)
                abort_("[write_png_file] png_create_write_struct failed");

        info_ptr = png_create_info_struct(png_ptr);
        if (!info_ptr)
                abort_("[write_png_file] png_create_info_struct failed");

        if (setjmp(png_jmpbuf(png_ptr)))
                abort_("[write_png_file] Error during init_io");

        png_init_io(png_ptr, fp);

        /* write header */
        if (setjmp(png_jmpbuf(png_ptr)))
                abort_("[write_png_file] Error during writing header");

        png_set_IHDR(png_ptr, info_ptr, width, height,
                     bit_depth, color_type, PNG_INTERLACE_NONE,
                     PNG_COMPRESSION_TYPE_BASE, PNG_FILTER_TYPE_BASE);

        png_write_info(png_ptr, info_ptr);

        /* write bytes */
        if (setjmp(png_jmpbuf(png_ptr)))
                abort_("[write_png_file] Error during writing bytes");

        png_write_image(png_ptr, row_pointers);

        /* end write */
        if (setjmp(png_jmpbuf(png_ptr)))
                abort_("[write_png_file] Error during end of write");

        png_write_end(png_ptr, NULL);

        /* cleanup heap allocation */
        for (y = 0; y < height; y++)
                free(row_pointers[y]);
        free(row_pointers);

        fclose(fp);
}

void process_file(void)
{

        if (png_get_color_type(png_ptr, info_ptr) == PNG_COLOR_TYPE_RGB)
                abort_("[process_file] input file is PNG_COLOR_TYPE_RGB but must be PNG_COLOR_TYPE_RGBA "
                       "(lacks the alpha channel)");

        if (png_get_color_type(png_ptr, info_ptr) != PNG_COLOR_TYPE_RGBA)
                abort_("[process_file] color_type of input file must be PNG_COLOR_TYPE_RGBA (%d) (is %d)",
                       PNG_COLOR_TYPE_RGBA, png_get_color_type(png_ptr, info_ptr));
        uint8_t *pointer_begining = (uint8_t *)malloc(height * width * sizeof(uint8_t));
        printf("Memory size: %d\n", height * width * sizeof(uint8_t));
        printf("Memory space: %8x\n", pointer_begining);
        printf("The data at place = %d\n", *pointer_begining);
        printf("The data at place = %d\n", pointer_begining[4]);
        printf("The data at place = %d\n", pointer_begining[width * height]);
        for (y = 0; y < height; y++)
        {
                png_byte *row = row_pointers[y];
                for (x = 0; x < width; x++)
                {
                        png_byte *ptr = &(row[x * 4]);

                        /* set red value to 0 and green value to the blue one */
                        int average = (ptr[0] + ptr[1] + ptr[2]) / 3;
                        //printf("%d",y * height + x);
                        pointer_begining[y * width + x] = average;
                        //printf("pointer_begining[y(%d) * height(%d) + x(%d)] = %d\n", y, height, x, pointer_begining[y * height + x]);
                }
        }
        uint8_t Gaussian[5][5] = {
            {2, 4, 5, 4, 2},
            {4, 9, 12, 9, 4},
            {5, 12, 15, 12, 5},
            {4, 9, 12, 9, 4},
            {2, 4, 5, 4, 2}};
        int8_t Gaussian_max = 159;

        uint8_t *new_array = (uint8_t *)malloc(height * width * sizeof(uint8_t));
        uint8_t x1, y1;
        for (y = 0; y < height - 4; y++)
        {
                png_byte *row = row_pointers[y];
                for (x = 0; x < width - 4; x++)
                {
                        uint32_t sum = 0;
                        for (y1 = 0; y1 < 5; y1++)
                        {
                                for (x1 = 0; x1 < 5; x1++)
                                {
                                        sum += (uint32_t)pointer_begining[(y + y1) * width + (x + x1)] * (uint32_t)Gaussian[x1][y1];
                                }

                        }
                        
                                new_array[y * width + x] = sum / 159;
                }
        }

        int8_t Gx[3][3] = {
            {-1, 0, 1},
            {-2, 0, 2},
            {-1, 0, 1}};
        int8_t Gy[3][3] = {
            {-1, -2, -1},
            {0, 0, 0},
            {1, 2, 1}};

        //uint8_t *new_array = (uint8_t *)malloc(height * width * sizeof(uint8_t));
        for (y = 0; y < height - 6; y++)
        {
                png_byte *row = row_pointers[y];
                for (x = 0; x < width - 6; x++)
                {
                        double sum_x = 0;
                        double sum_y = 0;
                        for (y1 = 0; y1 < 3; y1++)
                        {
                                for (x1 = 0; x1 < 3; x1++)
                                {
                                        sum_x += (double)new_array[(y + y1) * width + (x + x1)] * (double)Gx[x1][y1];
                                        sum_y += (double)new_array[(y + y1) * width + (x + x1)] * (double)Gy[x1][y1];
                                }
                        }
                        // /printf("%f %f %d\n",sum_x,sum_y,(uint8_t)(sqrt((double)sum_x * sum_x + sum_y * sum_y)*255/360));
                        pointer_begining[y * width + x] = (uint8_t)(sqrt(sum_x * sum_x + sum_y * sum_y)*255/360);
                }
        }

        for (y = 0; y < height; y++)
        {
                png_byte *row = row_pointers[y];
                for (x = 0; x < width; x++)
                {
                        png_byte *ptr = &(row[x * 4]);

                        /* set red value to 0 and green value to the blue one */
                        //printf("read pointer_begining[y(%d) * height(%d) + x(%d)] = %d\n", y, height, x, pointer_begining[y * width + x]);
                        int average = pointer_begining[y * width + x];
                        ptr[0] = average;
                        ptr[1] = average;
                        ptr[2] = average;
                }
        }
}

int main(int argc, char **argv)
{
        if (argc != 3)
                abort_("Usage: program_name <file_in> <file_out>");

        read_png_file(argv[1]);
        printf("Decode Done!\n");
        process_file();
        printf("Encoding start!\n");
        write_png_file(argv[2]);

        return 0;
}
