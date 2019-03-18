import matplotlib.cm


def main():
    cm = matplotlib.cm.get_cmap('tab20')
    for ci in range(20):
        print('"#{:02x}{:02x}{:02x}",'.format(*[int(v*255) for v in cm(ci / 20)]))


if __name__ == '__main__':
    main()
